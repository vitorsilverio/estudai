import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { AuthService } from '../../core/services/auth.service';

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
  imports: [CommonModule],
  templateUrl: './progresso.component.html',
  styleUrl: './progresso.component.scss',
})
export class ProgressoComponent {
  private content = inject(ContentService);
  progress = inject(ProgressService);
  auth = inject(AuthService);

  topics = toSignal(this.content.getTopics(), { initialValue: [] });

  topicsCompletedCount = computed(() => this.progress.progress().completedTopicIds.length);
  totalTopics = computed(() => this.topics().length);
  overallPercent = computed(() => {
    const total = this.totalTopics();
    return total ? Math.round((this.topicsCompletedCount() / total) * 100) : 0;
  });

  badges = computed(() => this.progress.progress().badges.map((b) => BADGE_LABELS[b] ?? b));
  simuladoCount = computed(() => this.progress.progress().simuladoResults.length);

  exportProgress(): void {
    const snapshot = this.progress.exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progresso-fiscal-sanitario-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importProgress(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        this.progress.importSnapshot(JSON.parse(text));
        window.location.reload();
      })
      .finally(() => {
        input.value = '';
      });
  }

  signOut(): void {
    this.auth.signOutUser();
  }
}
