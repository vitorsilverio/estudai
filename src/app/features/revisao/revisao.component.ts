import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { Question } from '../../models/content.model';
import { QuizFinishedEvent, QuizRunnerComponent } from '../../shared/quiz/quiz-runner.component';

const MASTERY_DOMINADO = 4;
const REVIEW_SET_SIZE = 10;

@Component({
  selector: 'app-revisao',
  standalone: true,
  imports: [CommonModule, RouterLink, QuizRunnerComponent],
  templateUrl: './revisao.component.html',
  styleUrl: './revisao.component.scss',
})
export class RevisaoComponent {
  private content = inject(ContentService);
  private progress = inject(ProgressService);
  private profile = inject(ProfileService);

  private examId = this.profile.activeExamId()!;

  finished = signal(false);

  reviewQuestions = toSignal(
    this.content.getTopics(this.examId).pipe(
      switchMap((topics) =>
        forkJoin(
          topics.map((t) =>
            this.content.getQuestions(this.examId, t.id).pipe(catchError(() => of([] as Question[]))),
          ),
        ),
      ),
      map((questionLists) => {
        const all = questionLists.flat();
        const dueForReview = all.filter((q) => this.progress.masteryFor(q.id) < MASTERY_DOMINADO);
        const sortedIds = this.progress.sortByReviewPriority(dueForReview.map((q) => q.id));
        return sortedIds
          .slice(0, REVIEW_SET_SIZE)
          .map((id) => all.find((q) => q.id === id)!)
          .filter(Boolean);
      }),
    ),
    { initialValue: [] as Question[] },
  );

  onFinished(event: QuizFinishedEvent): void {
    for (const attempt of event.attempts) {
      this.progress.recordPracticeAttempt(attempt);
    }
    this.finished.set(true);
  }
}
