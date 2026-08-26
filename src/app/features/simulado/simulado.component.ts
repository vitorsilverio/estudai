import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { SimuladoStateService } from '../../core/services/simulado-state.service';
import { Question } from '../../models/content.model';
import { SimuladoResult } from '../../models/progress.model';
import { QuizFinishedEvent, QuizRunnerComponent } from '../../shared/quiz/quiz-runner.component';

@Component({
  selector: 'app-simulado',
  standalone: true,
  imports: [CommonModule, QuizRunnerComponent],
  templateUrl: './simulado.component.html',
  styleUrl: './simulado.component.scss',
})
export class SimuladoComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private content = inject(ContentService);
  private progress = inject(ProgressService);
  private simuladoState = inject(SimuladoStateService);

  topicId = this.route.snapshot.paramMap.get('topicId')!;

  questions = toSignal(this.content.getQuestions(this.topicId), { initialValue: [] as Question[] });

  onFinished(event: QuizFinishedEvent): void {
    const now = new Date().toISOString();
    const correctCount = event.attempts.filter((a) => a.correct).length;
    const result: SimuladoResult = {
      id: crypto.randomUUID(),
      examId: 'fiscal-sanitario-sao-roque-2026',
      topicIds: [this.topicId],
      startedAt: now,
      finishedAt: now,
      totalTimeMs: event.totalTimeMs,
      attempts: event.attempts,
      score: event.attempts.length ? correctCount / event.attempts.length : 0,
    };
    this.progress.recordSimulado(result);
    this.simuladoState.setResult({
      topicId: this.topicId,
      questions: this.questions(),
      attempts: event.attempts,
      totalTimeMs: event.totalTimeMs,
    });
    this.router.navigate(['/simulado', this.topicId, 'resultado'], { replaceUrl: true });
  }

  exitToTrilha(): void {
    this.router.navigate(['/trilha'], { replaceUrl: true });
  }
}
