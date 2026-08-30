import { Injectable, computed, signal } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Attempt,
  ConfidenceLevel,
  EMPTY_PROGRESS,
  FlashcardRating,
  SimuladoResult,
  UserProgress,
} from '../../models/progress.model';
import { getDb } from '../firebase-app';

const STORAGE_KEY_PREFIX = 'efs.progress.v2';

const MASTERY_DELTA: Record<ConfidenceLevel, { correct: number; wrong: number }> = {
  certeza: { correct: 2, wrong: -2 },
  duvida: { correct: 1, wrong: -1 },
  chute: { correct: 0, wrong: -1 },
};

const FLASHCARD_MASTERY_DELTA: Record<FlashcardRating, number> = {
  esqueci: -2,
  quase: 1,
  facil: 2,
};

const MASTERY_MIN = 0;
const MASTERY_MAX = 5;

const POINTS_PER_TOPIC_COMPLETED = 10;
const POINTS_PER_CORRECT_PRACTICE = 5;
const POINTS_PER_CORRECT_SIMULADO = 2;
const POINTS_PER_FLASHCARD_REVIEWED = 2;
const POINTS_PER_DAILY_REVIEW = 15;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly state = signal<UserProgress>(structuredClone(EMPTY_PROGRESS));

  readonly progress = this.state.asReadonly();
  readonly points = computed(() => this.state().points);
  readonly level = computed(() => 1 + Math.floor(this.state().points / 100));
  readonly streakCount = computed(() => this.state().streak.count);

  private db: Firestore = getDb();
  private uid: string | null = null;
  private examId: string | null = null;
  private ownerMeta: { email: string | null; displayName: string | null } | null = null;

  constructor() {
    // Best-effort: ask the browser not to evict this site's storage under pressure,
    // so progress survives even without the app being reinstalled/reopened often.
    navigator.storage?.persist?.().catch(() => {});
  }

  /**
   * Called after login and whenever the active exam changes. Loads the local (offline) copy
   * for that specific exam first for instant UI, then reconciles with the remote copy: remote
   * wins if it already exists (cross-device continuity); otherwise the local snapshot is
   * uploaded as the first copy in Firestore.
   */
  async bindToUser(
    uid: string,
    examId: string,
    owner: { email: string | null; displayName: string | null },
  ): Promise<void> {
    this.uid = uid;
    this.examId = examId;
    this.ownerMeta = owner;
    this.state.set(this.loadLocal(examId));

    try {
      const snap = await getDoc(doc(this.db, 'users', uid, 'examProgress', examId));
      if (snap.exists()) {
        this.importSnapshot(snap.data() as UserProgress);
      } else {
        await this.pushToRemote(this.state());
      }
    } catch (err) {
      console.warn('Não foi possível sincronizar com o Firestore, mantendo progresso local.', err);
    }
  }

  /** Called on logout: stop syncing writes to remote, keep the local copy intact. */
  detachFromRemote(): void {
    this.uid = null;
    this.examId = null;
    this.ownerMeta = null;
  }

  private async pushToRemote(data: UserProgress): Promise<void> {
    if (!this.uid || !this.examId) return;
    try {
      await setDoc(doc(this.db, 'users', this.uid, 'examProgress', this.examId), {
        ...data,
        // Metadata only, so it's easy to tell whose document is whose in the Firestore console.
        _owner: {
          email: this.ownerMeta?.email ?? null,
          displayName: this.ownerMeta?.displayName ?? null,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn('Não foi possível salvar o progresso no Firestore agora; ele continua salvo localmente.', err);
    }
  }

  private storageKey(examId: string | null): string {
    return `${STORAGE_KEY_PREFIX}.${examId ?? 'unknown'}`;
  }

  private loadLocal(examId: string): UserProgress {
    try {
      const raw = localStorage.getItem(this.storageKey(examId));
      if (!raw) return structuredClone(EMPTY_PROGRESS);
      return { ...structuredClone(EMPTY_PROGRESS), ...JSON.parse(raw) };
    } catch {
      return structuredClone(EMPTY_PROGRESS);
    }
  }

  private persist(next: UserProgress): void {
    this.state.set(next);
    localStorage.setItem(this.storageKey(this.examId), JSON.stringify(next));
    void this.pushToRemote(next);
  }

  private touchStreak(p: UserProgress): UserProgress {
    const today = todayIso();
    const { lastStudyDate, count } = p.streak;
    if (lastStudyDate === today) return p;
    const gap = lastStudyDate ? daysBetween(lastStudyDate, today) : null;
    const nextCount = gap === 1 ? count + 1 : 1;
    return { ...p, streak: { count: nextCount, lastStudyDate: today } };
  }

  private awardBadges(p: UserProgress): UserProgress {
    const badges = new Set(p.badges);
    const streakMilestones = [3, 7, 14, 30];
    for (const m of streakMilestones) {
      if (p.streak.count >= m) badges.add(`streak-${m}`);
    }
    if (p.simuladoResults.length >= 1) badges.add('primeiro-simulado');
    return { ...p, badges: Array.from(badges) };
  }

  recordTopicCompleted(topicId: string): void {
    let p = this.state();
    if (p.completedTopicIds.includes(topicId)) return;
    p = this.touchStreak(p);
    p = {
      ...p,
      points: p.points + POINTS_PER_TOPIC_COMPLETED,
      completedTopicIds: [...p.completedTopicIds, topicId],
    };
    this.persist(this.awardBadges(p));
  }

  /** Practice attempts (mini-quiz with immediate feedback) award points on correct answers. */
  recordPracticeAttempt(attempt: Attempt): void {
    let p = this.state();
    p = this.touchStreak(p);
    p = this.applyMastery(p, attempt);
    if (attempt.correct) {
      p = { ...p, points: p.points + POINTS_PER_CORRECT_PRACTICE };
    }
    this.persist(this.awardBadges(p));
  }

  recordSimulado(result: SimuladoResult): void {
    let p = this.state();
    p = this.touchStreak(p);
    for (const attempt of result.attempts) {
      p = this.applyMastery(p, attempt);
    }
    const correctCount = result.attempts.filter((a) => a.correct).length;
    p = {
      ...p,
      points: p.points + correctCount * POINTS_PER_CORRECT_SIMULADO,
      simuladoResults: [...p.simuladoResults, result],
    };
    this.persist(this.awardBadges(p));
  }

  private applyMastery(p: UserProgress, attempt: Attempt): UserProgress {
    const delta = MASTERY_DELTA[attempt.confidence];
    const change = attempt.correct ? delta.correct : delta.wrong;
    const current = p.questionMastery[attempt.questionId] ?? 0;
    const next = Math.min(MASTERY_MAX, Math.max(MASTERY_MIN, current + change));
    return {
      ...p,
      questionMastery: { ...p.questionMastery, [attempt.questionId]: next },
    };
  }

  masteryFor(questionId: string): number {
    return this.state().questionMastery[questionId] ?? 0;
  }

  recordFlashcardReview(flashcardId: string, rating: FlashcardRating): void {
    let p = this.state();
    p = this.touchStreak(p);
    const current = p.flashcardMastery[flashcardId] ?? 0;
    const next = Math.min(MASTERY_MAX, Math.max(MASTERY_MIN, current + FLASHCARD_MASTERY_DELTA[rating]));
    p = {
      ...p,
      points: p.points + POINTS_PER_FLASHCARD_REVIEWED,
      flashcardMastery: { ...p.flashcardMastery, [flashcardId]: next },
    };
    this.persist(this.awardBadges(p));
  }

  flashcardMasteryFor(flashcardId: string): number {
    return this.state().flashcardMastery[flashcardId] ?? 0;
  }

  /** Sorts flashcard ids ascending by mastery — lowest mastery reviewed first. */
  sortFlashcardsByReviewPriority(flashcardIds: string[]): string[] {
    const mastery = this.state().flashcardMastery;
    return [...flashcardIds].sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0));
  }

  /**
   * Bloco 1 do ritual: mapa mental + pontos de atenção do dia, lidos ANTES de qualquer questão.
   * Idempotente — só conta uma vez por dia, mesmo se chamado de novo.
   */
  completeDailyReview(): void {
    let p = this.state();
    if (p.lastDailyReviewDate === todayIso()) return;
    p = this.touchStreak(p);
    p = { ...p, points: p.points + POINTS_PER_DAILY_REVIEW, lastDailyReviewDate: todayIso() };
    this.persist(this.awardBadges(p));
  }

  readonly hasDoneDailyReviewToday = computed(() => this.state().lastDailyReviewDate === todayIso());

  /** Restores progress from a snapshot (used when pulling the remote copy from Firestore). */
  importSnapshot(data: UserProgress): void {
    const { _owner, ...clean } = data as UserProgress & { _owner?: unknown };
    const merged = { ...structuredClone(EMPTY_PROGRESS), ...clean };
    this.persist(merged);
  }

  isTopicCompleted(topicId: string): boolean {
    return this.state().completedTopicIds.includes(topicId);
  }

  /** Sorts question ids by mastery ascending (lowest mastery first = highest review priority). */
  sortByReviewPriority(questionIds: string[]): string[] {
    const mastery = this.state().questionMastery;
    return [...questionIds].sort((a, b) => (mastery[a] ?? 0) - (mastery[b] ?? 0));
  }
}
