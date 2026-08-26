import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private startedAt = 0;
  private elapsedBeforePause = 0;
  private readonly running = signal(false);

  readonly isRunning = this.running.asReadonly();

  start(): void {
    this.startedAt = Date.now();
    this.elapsedBeforePause = 0;
    this.running.set(true);
  }

  stop(): number {
    const total = this.elapsedMs();
    this.running.set(false);
    return total;
  }

  elapsedMs(): number {
    if (!this.running()) return this.elapsedBeforePause;
    return this.elapsedBeforePause + (Date.now() - this.startedAt);
  }

  static formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
