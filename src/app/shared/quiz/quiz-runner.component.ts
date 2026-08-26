import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../models/content.model';
import { Attempt } from '../../models/progress.model';
import { QuestionAnswer, QuestionCardComponent } from './question-card.component';
import { TimerService } from '../../core/services/timer.service';

export interface QuizFinishedEvent {
  attempts: Attempt[];
  totalTimeMs: number;
}

@Component({
  selector: 'app-quiz-runner',
  standalone: true,
  imports: [CommonModule, QuestionCardComponent],
  templateUrl: './quiz-runner.component.html',
  styleUrl: './quiz-runner.component.scss',
})
export class QuizRunnerComponent implements OnInit, OnDestroy {
  private timer = inject(TimerService);

  @Input({ required: true }) questions: Question[] = [];
  /** 'immediate' shows correct/wrong right after answering (practice/review). 'deferred' hides it (simulado). */
  @Input() feedbackMode: 'immediate' | 'deferred' = 'immediate';

  @Output() finished = new EventEmitter<QuizFinishedEvent>();

  currentIndex = signal(0);
  private attempts: Attempt[] = [];
  lastAnswer: QuestionAnswer | null = null;

  get currentQuestion(): Question | null {
    return this.questions[this.currentIndex()] ?? null;
  }

  get showFeedback(): boolean {
    return this.feedbackMode === 'immediate';
  }

  get hasAnsweredCurrent(): boolean {
    return this.lastAnswer !== null;
  }

  ngOnInit(): void {
    this.timer.start();
  }

  ngOnDestroy(): void {
    if (this.timer.isRunning()) this.timer.stop();
  }

  onAnswered(answer: QuestionAnswer): void {
    const question = this.currentQuestion;
    if (!question) return;
    this.lastAnswer = answer;
    this.attempts.push({
      questionId: question.id,
      selectedOptionId: answer.optionId,
      confidence: answer.confidence,
      correct: answer.optionId === question.correctOptionId,
      timestamp: new Date().toISOString(),
    });
  }

  goToNext(): void {
    this.lastAnswer = null;
    if (this.currentIndex() + 1 < this.questions.length) {
      this.currentIndex.update((i) => i + 1);
      return;
    }
    const totalTimeMs = this.timer.stop();
    this.finished.emit({ attempts: this.attempts, totalTimeMs });
  }
}
