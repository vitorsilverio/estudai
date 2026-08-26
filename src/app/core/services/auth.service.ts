import { Injectable, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
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
    getRedirectResult(this.auth).catch((err) => {
      this.error.set('Não foi possível entrar com o Google. Tente novamente.');
      console.error('Erro no login por redirect', err);
    });

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
    });
  }

  signInWithGoogle(): void {
    this.error.set(null);
    signInWithRedirect(this.auth, new GoogleAuthProvider());
  }

  signOutUser(): Promise<void> {
    return signOut(this.auth);
  }
}
