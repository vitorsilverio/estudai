import { Injectable, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { getFirebaseApp } from '../firebase-app';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = getAuth(getFirebaseApp());

  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
    });
  }

  async signInWithGoogle(): Promise<void> {
    this.error.set(null);
    const provider = new GoogleAuthProvider();
    try {
      // Popup keeps the whole flow same-tab/same-storage-context, which avoids the
      // cross-domain storage-partitioning issue that breaks signInWithRedirect when
      // the Firebase authDomain (firebaseapp.com) differs from the app's real host
      // (github.io) — the redirect flow bounced back without a persisted session.
      await signInWithPopup(this.auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        // Fallback for browsers/contexts that block popups (e.g. some installed PWA shells).
        await signInWithRedirect(this.auth, provider);
        return;
      }
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return; // user just closed the popup, not a real error
      }
      this.error.set('Não foi possível entrar com o Google. Tente novamente.');
      console.error('Erro no login com Google', err);
    }
  }

  signOutUser(): Promise<void> {
    return signOut(this.auth);
  }
}
