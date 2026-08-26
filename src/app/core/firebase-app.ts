import { FirebaseApp, initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase.config';

let app: FirebaseApp | undefined;

/** Single shared Firebase app instance, initialized lazily on first use. */
export function getFirebaseApp(): FirebaseApp {
  app ??= initializeApp(firebaseConfig);
  return app;
}
