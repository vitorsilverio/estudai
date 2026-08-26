import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { ContentPage, Exam, Question, Subject, Topic } from '../../models/content.model';

const EXAM_ID = 'fiscal-sanitario-sao-roque-2026';
const BASE = `content/${EXAM_ID}`;

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  private exam$?: Observable<Exam>;
  private subjects$?: Observable<Subject[]>;
  private topics$?: Observable<Topic[]>;

  getExam(): Observable<Exam> {
    this.exam$ ??= this.http.get<Exam>(`${BASE}/exam.json`).pipe(shareReplay(1));
    return this.exam$;
  }

  getSubjects(): Observable<Subject[]> {
    this.subjects$ ??= this.http
      .get<Subject[]>(`${BASE}/subjects.json`)
      .pipe(shareReplay(1));
    return this.subjects$;
  }

  getTopics(): Observable<Topic[]> {
    this.topics$ ??= this.http.get<Topic[]>(`${BASE}/topics.json`).pipe(shareReplay(1));
    return this.topics$;
  }

  getTopicsForSubject(subjectId: string): Observable<Topic[]> {
    return this.getTopics().pipe(
      map((topics) => topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order)),
    );
  }

  getPages(topicId: string): Observable<ContentPage[]> {
    return this.http
      .get<ContentPage[]>(`${BASE}/pages/${topicId}.json`)
      .pipe(map((pages) => [...pages].sort((a, b) => a.order - b.order)));
  }

  getQuestions(topicId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${BASE}/questions/${topicId}.json`);
  }
}
