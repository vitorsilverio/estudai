export type ConfidenceLevel = 'certeza' | 'duvida' | 'chute';

export interface Attempt {
  questionId: string;
  selectedOptionId: string;
  confidence: ConfidenceLevel;
  correct: boolean;
  timestamp: string; // ISO
}

export interface SimuladoResult {
  id: string;
  examId: string;
  topicIds: string[];
  startedAt: string;
  finishedAt: string;
  totalTimeMs: number;
  attempts: Attempt[];
  score: number; // 0-1
}

export interface StreakState {
  count: number;
  lastStudyDate: string | null; // yyyy-mm-dd
}

export interface UserProgress {
  points: number;
  streak: StreakState;
  completedTopicIds: string[];
  questionMastery: Record<string, number>; // 0..5
  badges: string[];
  simuladoResults: SimuladoResult[];
}

export const EMPTY_PROGRESS: UserProgress = {
  points: 0,
  streak: { count: 0, lastStudyDate: null },
  completedTopicIds: [],
  questionMastery: {},
  badges: [],
  simuladoResults: [],
};
