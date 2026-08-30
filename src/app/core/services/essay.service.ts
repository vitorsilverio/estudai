import { Injectable } from '@angular/core';
import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { Observable, from, map } from 'rxjs';
import { getDb } from '../firebase-app';
import { EssaySubmission } from '../../models/essay.model';

@Injectable({ providedIn: 'root' })
export class EssayService {
  private db = getDb();

  getMyEssays(uid: string): Observable<EssaySubmission[]> {
    const ref = query(collection(this.db, 'users', uid, 'essays'), orderBy('createdAt', 'desc'));
    return from(getDocs(ref)).pipe(map((snap) => snap.docs.map((d) => d.data() as EssaySubmission)));
  }

  async submit(uid: string, images: string[], note: string): Promise<void> {
    const id = crypto.randomUUID();
    const submission: EssaySubmission = {
      id,
      createdAt: new Date().toISOString(),
      note,
      images,
      status: 'pending',
      correction: null,
    };
    await setDoc(doc(this.db, 'users', uid, 'essays', id), submission);
  }
}
