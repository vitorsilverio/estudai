import { Injectable, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '../firebase-app';
import { UserProfile } from '../../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private db = getDb();

  readonly activeExamId = signal<string | null>(null);
  readonly isLoading = signal(true);

  private uid: string | null = null;

  async loadForUser(uid: string, owner: { email: string | null; displayName: string | null }): Promise<void> {
    this.uid = uid;
    this.isLoading.set(true);
    try {
      const ref = doc(this.db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        this.activeExamId.set((snap.data() as UserProfile).activeExamId ?? null);
      } else {
        const profile: UserProfile = {
          activeExamId: null,
          email: owner.email,
          displayName: owner.displayName,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(ref, profile);
        this.activeExamId.set(null);
      }
    } catch (err) {
      console.warn('Não foi possível carregar o perfil do Firestore.', err);
      this.activeExamId.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async setActiveExam(examId: string): Promise<void> {
    if (!this.uid) return;
    this.activeExamId.set(examId);
    await setDoc(
      doc(this.db, 'users', this.uid),
      { activeExamId: examId, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }

  reset(): void {
    this.uid = null;
    this.activeExamId.set(null);
    this.isLoading.set(true);
  }
}
