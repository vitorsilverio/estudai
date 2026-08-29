export interface Exam {
  id: string;
  name: string;
  examDate: string; // ISO date
  cutoffPercent: number; // e.g. 50
}

export interface Subject {
  id: string;
  examId: string;
  name: string;
  order: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export type ContentBlockType = 'text' | 'tip' | 'image';

export interface ContentBlock {
  type: ContentBlockType;
  value: string;
}

export interface ContentPage {
  id: string;
  topicId: string;
  order: number;
  title: string;
  blocks: ContentBlock[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  topicId: string;
  statement: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
}

export interface Flashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
}
