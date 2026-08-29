import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';
import { Exam } from '../../models/content.model';

@Component({
  selector: 'app-exam-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-picker.component.html',
  styleUrl: './exam-picker.component.scss',
})
export class ExamPickerComponent {
  private content = inject(ContentService);
  private profile = inject(ProfileService);
  private auth = inject(AuthService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  /** 'onboarding' (first login, no back button) or 'switch' (voluntary change, from Progresso). */
  @Input() mode: 'onboarding' | 'switch' = 'switch';

  exams = toSignal(this.content.getExams(), { initialValue: [] as Exam[] });
  activeExamId = this.profile.activeExamId;

  async choose(examId: string): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    await this.profile.setActiveExam(examId);
    await this.progress.bindToUser(user.uid, examId, { email: user.email, displayName: user.displayName });
    if (this.mode === 'switch') {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  goBack(): void {
    this.router.navigate(['/progresso']);
  }
}
