import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ALLOWED_ESSAY_EMAILS } from '../../core/allowed-emails';
import { Exam } from '../../models/content.model';

const BADGE_LABELS: Record<string, string> = {
  'streak-3': '🔥 3 dias seguidos',
  'streak-7': '🔥 1 semana seguida',
  'streak-14': '🔥 2 semanas seguidas',
  'streak-30': '🔥 1 mês seguido',
  'primeiro-simulado': '📝 Primeiro simulado',
};

@Component({
  selector: 'app-progresso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './progresso.component.html',
  styleUrl: './progresso.component.scss',
})
export class ProgressoComponent {
  private content = inject(ContentService);
  progress = inject(ProgressService);
  profile = inject(ProfileService);
  auth = inject(AuthService);

  private examId = this.profile.activeExamId()!;

  topics = toSignal(this.content.getTopics(this.examId), { initialValue: [] });
  exams = toSignal(this.content.getExams(), { initialValue: [] as Exam[] });
  activeExam = computed(() => this.exams().find((e) => e.id === this.examId) ?? null);

  topicsCompletedCount = computed(() => this.progress.progress().completedTopicIds.length);
  totalTopics = computed(() => this.topics().length);
  overallPercent = computed(() => {
    const total = this.totalTopics();
    return total ? Math.round((this.topicsCompletedCount() / total) * 100) : 0;
  });

  badges = computed(() => this.progress.progress().badges.map((b) => BADGE_LABELS[b] ?? b));
  simuladoCount = computed(() => this.progress.progress().simuladoResults.length);

  get canUseRedacao(): boolean {
    return ALLOWED_ESSAY_EMAILS.includes(this.auth.currentUser()?.email ?? '');
  }

  signOut(): void {
    this.auth.signOutUser();
  }
}
