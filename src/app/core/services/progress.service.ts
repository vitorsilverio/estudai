import { Injectable, computed, signal } from '@angular/core';
import { Attempt, ConfidenceLevel, EMPTY_PROGRESS, SimuladoResult, UserProgress } from '../../models/progress.model';

const STORAGE_KEY = 'efs.progress.v1';

const MASTERY_DELTA: Record<ConfidenceLevel, { correct: number; wrong: number }> = {
  certeza: { correct: 2, wrong: -2 },
  duvida: { correct: 1, wrong: -1 },
  chute: { correct: 0, wrong: -1 },
};

const MASTERY_MIN = 0;
const MASTERY_MAX = 5;

const POINTS_PER_TOPIC_COMPLETED = 10;
const POINTS_PER_CORRECT_PRACTICE = 5;
const POINTS_PER_CORRECT_SIMULADO = 2;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly state = signal<UserProgress>(this.load());

  readonly progress = this.state.asReadonly();
  readonly points = computed(() => this.state().points);
  readonly level = computed(() => 1 + Math.floor(this.state().points / 100));
  readonly streakCount = computed(() => this.state().streak.count);

  constructor() {
    // Best-effort: ask the browser not to evict this site's storage under pressure,
    // so her progress survives even without the app being reinstalled/reopened often.
    navigator.storage?.persist?.().catch(() => {});
  }

  private load(): UserProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(EMPTY_PROGRESS);
      return { ...structuredClone(EMPTY_PROGRESS), ...JSON.parse(raw) };
    } catch {
      return structuredClone(EMPTY_PROGRESS);
    }
  }

  private persist(next: UserProgress): void {
    this.state.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

  /** Full snapshot of the current progress, for export/backup purposes. */
  exportSnapshot(): UserProgress {
    return structuredClone(this.state());
  }

  /** Restores progress from a previously exported snapshot (e.g. after switching devices). */
  importSnapshot(data: UserProgress): void {
    const merged = { ...structuredClone(EMPTY_PROGRESS), ...data };
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
