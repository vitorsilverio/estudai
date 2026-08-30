import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService, DailyKeyPoints } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { SpeechService } from '../../core/services/speech.service';
import { parseMindmap } from '../../shared/mindmap';

@Component({
  selector: 'app-leitura-diaria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leitura-diaria.component.html',
  styleUrl: './leitura-diaria.component.scss',
})
export class LeituraDiariaComponent {
  private content = inject(ContentService);
  private progress = inject(ProgressService);
  private profile = inject(ProfileService);
  private speech = inject(SpeechService);
  private router = inject(Router);

  private examId = this.profile.activeExamId()!;

  groups = toSignal(this.content.getDailyKeyPoints(this.examId), { initialValue: [] as DailyKeyPoints[] });

  parseMindmap = parseMindmap;

  get speechSupported(): boolean {
    return this.speech.supported;
  }

  get alreadyDoneToday(): boolean {
    return this.progress.hasDoneDailyReviewToday();
  }

  readAloud(group: DailyKeyPoints): void {
    const text = group.blocks.map((b) => b.value).join('. ');
    this.speech.speak(`${group.topic.name}. ${text}`);
  }

  finish(): void {
    this.progress.completeDailyReview();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
