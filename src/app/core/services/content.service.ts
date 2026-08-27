import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Observable, from, map, shareReplay } from 'rxjs';
import { ContentPage, Exam, Question, Subject, Topic } from '../../models/content.model';
import { getDb } from '../firebase-app';

const EXAM_ID = 'fiscal-sanitario-sao-roque-2026';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private db = getDb();

  private exam$?: Observable<Exam>;
  private subjects$?: Observable<Subject[]>;
  private topics$?: Observable<Topic[]>;

  getExam(): Observable<Exam> {
    this.exam$ ??= from(getDoc(doc(this.db, 'exams', EXAM_ID))).pipe(
      map((snap) => snap.data() as Exam),
      shareReplay(1),
    );
    return this.exam$;
  }

  getSubjects(): Observable<Subject[]> {
    this.subjects$ ??= from(getDocs(collection(this.db, 'exams', EXAM_ID, 'subjects'))).pipe(
      map((snap) => snap.docs.map((d) => d.data() as Subject)),
      shareReplay(1),
    );
    return this.subjects$;
  }

  getTopics(): Observable<Topic[]> {
    this.topics$ ??= from(getDocs(collection(this.db, 'exams', EXAM_ID, 'topics'))).pipe(
      map((snap) => snap.docs.map((d) => d.data() as Topic)),
      shareReplay(1),
    );
    return this.topics$;
  }

  getTopicsForSubject(subjectId: string): Observable<Topic[]> {
    return this.getTopics().pipe(
      map((topics) => topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order)),
    );
  }

  getPages(topicId: string): Observable<ContentPage[]> {
    const pagesRef = query(
      collection(this.db, 'exams', EXAM_ID, 'topics', topicId, 'pages'),
      orderBy('order'),
    );
    return from(getDocs(pagesRef)).pipe(map((snap) => snap.docs.map((d) => d.data() as ContentPage)));
  }

  getQuestions(topicId: string): Observable<Question[]> {
    const questionsRef = collection(this.db, 'exams', EXAM_ID, 'topics', topicId, 'questions');
    return from(getDocs(questionsRef)).pipe(map((snap) => snap.docs.map((d) => d.data() as Question)));
  }
}
