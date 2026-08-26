import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SimuladoStateService } from '../../core/services/simulado-state.service';
import { TimerService } from '../../core/services/timer.service';
import { Attempt } from '../../models/progress.model';
import { Question } from '../../models/content.model';

interface ResultRow {
  question: Question;
  attempt: Attempt;
}

@Component({
  selector: 'app-simulado-resultado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './simulado-resultado.component.html',
  styleUrl: './simulado-resultado.component.scss',
})
export class SimuladoResultadoComponent {
  private simuladoState = inject(SimuladoStateService);

  result = this.simuladoState.lastResult;

  rows = computed<ResultRow[]>(() => {
    const r = this.result();
    if (!r) return [];
    return r.attempts.map((attempt) => ({
      attempt,
      question: r.questions.find((q) => q.id === attempt.questionId)!,
    }));
  });

  correctCount = computed(() => this.rows().filter((r) => r.attempt.correct).length);
  scorePercent = computed(() => {
    const total = this.rows().length;
    return total ? Math.round((this.correctCount() / total) * 100) : 0;
  });
  formattedTime = computed(() => {
    const r = this.result();
    return r ? TimerService.formatMs(r.totalTimeMs) : '0:00';
  });

  guessesThatWorked = computed(() =>
    this.rows().filter((r) => r.attempt.confidence === 'chute' && r.attempt.correct),
  );
  confidentMistakes = computed(() =>
    this.rows().filter((r) => r.attempt.confidence === 'certeza' && !r.attempt.correct),
  );
}
