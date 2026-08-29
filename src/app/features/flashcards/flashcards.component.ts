import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProfileService } from '../../core/services/profile.service';
import { SpeechService } from '../../core/services/speech.service';
import { Flashcard } from '../../models/content.model';
import { FlashcardRating } from '../../models/progress.model';

const SESSION_SIZE = 15;

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flashcards.component.html',
  styleUrl: './flashcards.component.scss',
})
export class FlashcardsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private content = inject(ContentService);
  private progress = inject(ProgressService);
  private profile = inject(ProfileService);
  private speech = inject(SpeechService);

  private examId = this.profile.activeExamId()!;
  topicId = this.route.snapshot.paramMap.get('topicId')!;

  allCards = toSignal(this.content.getFlashcards(this.examId, this.topicId), {
    initialValue: [] as Flashcard[],
  });

  /** Session order is fixed once the cards arrive: lowest-mastery cards reviewed first. */
  sessionCards = computed<Flashcard[]>(() => {
    const cards = this.allCards();
    if (cards.length === 0) return [];
    const sortedIds = this.progress.sortFlashcardsByReviewPriority(cards.map((c) => c.id));
    return sortedIds.slice(0, SESSION_SIZE).map((id) => cards.find((c) => c.id === id)!);
  });

  currentIndex = signal(0);
  flipped = signal(false);
  reviewedCount = signal(0);

  get currentCard(): Flashcard | null {
    return this.sessionCards()[this.currentIndex()] ?? null;
  }

  get isDone(): boolean {
    return this.allCards().length > 0 && this.currentIndex() >= this.sessionCards().length;
  }

  get speechSupported(): boolean {
    return this.speech.supported;
  }

  flip(): void {
    this.flipped.set(true);
  }

  readAloud(): void {
    const card = this.currentCard;
    if (!card) return;
    this.speech.speak(this.flipped() ? card.back : card.front);
  }

  rate(rating: FlashcardRating): void {
    const card = this.currentCard;
    if (!card) return;
    this.progress.recordFlashcardReview(card.id, rating);
    this.reviewedCount.update((n) => n + 1);
    this.flipped.set(false);
    this.currentIndex.update((i) => i + 1);
  }

  exitToTrilha(): void {
    this.router.navigate(['/trilha'], { replaceUrl: true });
  }
}
