import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
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

  subjects = toSignal(
    combineLatest([this.content.getSubjects(), this.content.getTopics()]).pipe(
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
