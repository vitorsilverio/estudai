import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EssayService } from '../../core/services/essay.service';
import { ALLOWED_ESSAY_EMAILS } from '../../core/allowed-emails';
import { EssaySubmission } from '../../models/essay.model';
import { compressImageToDataUrl } from '../../shared/image-compress';

@Component({
  selector: 'app-redacao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './redacao.component.html',
  styleUrl: './redacao.component.scss',
})
export class RedacaoComponent {
  private auth = inject(AuthService);
  private essayService = inject(EssayService);

  private user = this.auth.currentUser()!;

  get isAllowed(): boolean {
    return ALLOWED_ESSAY_EMAILS.includes(this.user.email ?? '');
  }

  essays = toSignal(
    this.isAllowed ? this.essayService.getMyEssays(this.user.uid) : of([] as EssaySubmission[]),
    { initialValue: [] as EssaySubmission[] },
  );

  pendingImages = signal<string[]>([]);
  note = signal('');
  isCompressing = signal(false);
  isSubmitting = signal(false);
  submitted = signal(false);

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    this.isCompressing.set(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImageToDataUrl(f)));
      this.pendingImages.update((imgs) => [...imgs, ...compressed]);
    } finally {
      this.isCompressing.set(false);
      input.value = '';
    }
  }

  removeImage(index: number): void {
    this.pendingImages.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  async submit(): Promise<void> {
    if (this.pendingImages().length === 0) return;
    this.isSubmitting.set(true);
    try {
      await this.essayService.submit(this.user.uid, this.pendingImages(), this.note());
      this.pendingImages.set([]);
      this.note.set('');
      this.submitted.set(true);
      setTimeout(() => this.submitted.set(false), 4000);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
