import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { SettingsService } from '../../core/services/settings.service';
import { SpeechService } from '../../core/services/speech.service';
import { ContentPage, Question } from '../../models/content.model';
import { QuizFinishedEvent, QuizRunnerComponent } from '../../shared/quiz/quiz-runner.component';

type Stage = 'loading' | 'reading' | 'quiz' | 'done';

@Component({
  selector: 'app-leitura',
  standalone: true,
  imports: [CommonModule, RouterLink, QuizRunnerComponent],
  templateUrl: './leitura.component.html',
  styleUrl: './leitura.component.scss',
})
export class LeituraComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private content = inject(ContentService);
  private progress = inject(ProgressService);
  private profile = inject(ProfileService);
  private speech = inject(SpeechService);
  settings = inject(SettingsService);

  private examId = this.profile.activeExamId()!;
  topicId = this.route.snapshot.paramMap.get('topicId')!;

  pages = toSignal(this.content.getPages(this.examId, this.topicId));
  questions = toSignal(this.content.getQuestions(this.examId, this.topicId), { initialValue: [] as Question[] });

  stage = signal<Stage>('reading');
  pageIndex = signal(0);
  pointsEarned = signal(0);

  get currentPage(): ContentPage | null {
    return this.pages()?.[this.pageIndex()] ?? null;
  }

  get isLastPage(): boolean {
    return this.pageIndex() + 1 >= (this.pages()?.length ?? 0);
  }

  get speechSupported(): boolean {
    return this.speech.supported;
  }

  readAloud(): void {
    const page = this.currentPage;
    if (!page) return;
    const text = page.blocks.map((b) => b.value).join('. ');
    this.speech.speak(`${page.title}. ${text}`);
  }

  nextPage(): void {
    if (this.isLastPage) {
      this.stage.set(this.questions().length > 0 ? 'quiz' : 'done');
      if (this.questions().length === 0) {
        this.progress.recordTopicCompleted(this.topicId);
      }
      return;
    }
    this.pageIndex.update((i) => i + 1);
  }

  onQuizFinished(event: QuizFinishedEvent): void {
    for (const attempt of event.attempts) {
      this.progress.recordPracticeAttempt(attempt);
    }
    this.progress.recordTopicCompleted(this.topicId);
    this.pointsEarned.set(event.attempts.filter((a) => a.correct).length * 5 + 10);
    this.stage.set('done');
  }

  goToTrilha(): void {
    this.router.navigate(['/trilha'], { replaceUrl: true });
  }
}
