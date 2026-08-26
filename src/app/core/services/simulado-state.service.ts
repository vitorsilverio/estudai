import { Injectable, signal } from '@angular/core';
import { Question } from '../../models/content.model';
import { Attempt } from '../../models/progress.model';

export interface SimuladoRunResult {
  topicId: string;
  questions: Question[];
  attempts: Attempt[];
  totalTimeMs: number;
}

@Injectable({ providedIn: 'root' })
export class SimuladoStateService {
  readonly lastResult = signal<SimuladoRunResult | null>(null);

  setResult(result: SimuladoRunResult): void {
    this.lastResult.set(result);
  }
}
