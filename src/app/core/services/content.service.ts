import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { Observable, from, map, shareReplay } from 'rxjs';
import { ContentPage, Exam, Flashcard, Question, Subject, Topic } from '../../models/content.model';
import { getDb } from '../firebase-app';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private db = getDb();

  private exams$?: Observable<Exam[]>;
  private examCache = new Map<string, Observable<Exam>>();
  private subjectsCache = new Map<string, Observable<Subject[]>>();
  private topicsCache = new Map<string, Observable<Topic[]>>();

  getExams(): Observable<Exam[]> {
    this.exams$ ??= from(getDocs(collection(this.db, 'exams'))).pipe(
      map((snap) => snap.docs.map((d) => d.data() as Exam)),
      shareReplay(1),
    );
    return this.exams$;
  }

  getExam(examId: string): Observable<Exam> {
    if (!this.examCache.has(examId)) {
      this.examCache.set(
        examId,
        from(getDoc(doc(this.db, 'exams', examId))).pipe(
          map((snap) => snap.data() as Exam),
          shareReplay(1),
        ),
      );
    }
    return this.examCache.get(examId)!;
  }

  getSubjects(examId: string): Observable<Subject[]> {
    if (!this.subjectsCache.has(examId)) {
      this.subjectsCache.set(
        examId,
        from(getDocs(collection(this.db, 'exams', examId, 'subjects'))).pipe(
          map((snap) => snap.docs.map((d) => d.data() as Subject)),
          shareReplay(1),
        ),
      );
    }
    return this.subjectsCache.get(examId)!;
  }

  getTopics(examId: string): Observable<Topic[]> {
    if (!this.topicsCache.has(examId)) {
      this.topicsCache.set(
        examId,
        from(getDocs(collection(this.db, 'exams', examId, 'topics'))).pipe(
          map((snap) => snap.docs.map((d) => d.data() as Topic)),
          shareReplay(1),
        ),
      );
    }
    return this.topicsCache.get(examId)!;
  }

  getTopicsForSubject(examId: string, subjectId: string): Observable<Topic[]> {
    return this.getTopics(examId).pipe(
      map((topics) => topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order)),
    );
  }

  getPages(examId: string, topicId: string): Observable<ContentPage[]> {
    const pagesRef = query(
      collection(this.db, 'exams', examId, 'topics', topicId, 'pages'),
      orderBy('order'),
    );
    return from(getDocs(pagesRef)).pipe(map((snap) => snap.docs.map((d) => d.data() as ContentPage)));
  }

  getQuestions(examId: string, topicId: string): Observable<Question[]> {
    const questionsRef = collection(this.db, 'exams', examId, 'topics', topicId, 'questions');
    return from(getDocs(questionsRef)).pipe(map((snap) => snap.docs.map((d) => d.data() as Question)));
  }

  getFlashcards(examId: string, topicId: string): Observable<Flashcard[]> {
    const flashcardsRef = collection(this.db, 'exams', examId, 'topics', topicId, 'flashcards');
    return from(getDocs(flashcardsRef)).pipe(map((snap) => snap.docs.map((d) => d.data() as Flashcard)));
  }
}
