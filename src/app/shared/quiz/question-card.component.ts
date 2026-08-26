import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfidenceLevel } from '../../models/progress.model';
import { Question } from '../../models/content.model';
import { SpeechService } from '../../core/services/speech.service';

export interface QuestionAnswer {
  optionId: string;
  confidence: ConfidenceLevel;
}

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-card.component.html',
  styleUrl: './question-card.component.scss',
})
export class QuestionCardComponent implements OnChanges {
  private speech = inject(SpeechService);

  @Input({ required: true }) question!: Question;
  @Input() questionNumber = 1;
  @Input() totalQuestions = 1;
  /** When true, shows correct/incorrect state immediately after answering. */
  @Input() showFeedback = false;

  @Output() answered = new EventEmitter<QuestionAnswer>();

  selectedOptionId: string | null = null;
  selectedConfidence: ConfidenceLevel | null = null;
  submitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['question']) {
      this.selectedOptionId = null;
      this.selectedConfidence = null;
      this.submitted = false;
    }
  }

  get speechSupported(): boolean {
    return this.speech.supported;
  }

  selectOption(optionId: string): void {
    if (this.submitted) return;
    this.selectedOptionId = optionId;
  }

  selectConfidence(level: ConfidenceLevel): void {
    if (this.submitted) return;
    this.selectedConfidence = level;
  }

  get canSubmit(): boolean {
    return !!this.selectedOptionId && !!this.selectedConfidence;
  }

  get isCorrect(): boolean {
    return this.selectedOptionId === this.question.correctOptionId;
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.submitted = true;
    this.answered.emit({ optionId: this.selectedOptionId!, confidence: this.selectedConfidence! });
  }

  readAloud(): void {
    const optionsText = this.question.options.map((o, i) => `Alternativa ${i + 1}: ${o.text}`).join('. ');
    this.speech.speak(`${this.question.statement}. ${optionsText}`);
  }
}
