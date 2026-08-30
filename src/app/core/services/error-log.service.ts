import { Injectable } from '@angular/core';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { getDb } from '../firebase-app';
import { ErrorLogEntry } from '../../models/error-log.model';

@Injectable({ providedIn: 'root' })
export class ErrorLogService {
  private db = getDb();

  getEntries(uid: string): Observable<ErrorLogEntry[]> {
    const ref = query(collection(this.db, 'users', uid, 'errorLog'), orderBy('date', 'desc'));
    return from(getDocs(ref)).pipe(map((snap) => snap.docs.map((d) => d.data() as ErrorLogEntry)));
  }
}
