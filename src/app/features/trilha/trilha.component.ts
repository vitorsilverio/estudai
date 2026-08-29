import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { Subject, Topic } from '../../models/content.model';

interface SubjectView extends Subject {
  topics: (Topic & { completed: boolean })[];
}

@Component({
  selector: 'app-trilha',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trilha.component.html',
  styleUrl: './trilha.component.scss',
})
export class TrilhaComponent {
  private content = inject(ContentService);
  private progress = inject(ProgressService);
  private profile = inject(ProfileService);

  private examId = this.profile.activeExamId()!;

  subjects = toSignal(
    combineLatest([this.content.getSubjects(this.examId), this.content.getTopics(this.examId)]).pipe(
      map(([subjects, topics]) =>
        [...subjects]
          .sort((a, b) => a.order - b.order)
          .map(
            (subject): SubjectView => ({
              ...subject,
              topics: topics
                .filter((t) => t.subjectId === subject.id)
                .sort((a, b) => a.order - b.order)
                .map((t) => ({ ...t, completed: this.progress.isTopicCompleted(t.id) })),
            }),
          ),
      ),
    ),
    { initialValue: [] as SubjectView[] },
  );
}
