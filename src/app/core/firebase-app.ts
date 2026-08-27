import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

/** Single shared Firebase app instance, initialized lazily on first use. */
export function getFirebaseApp(): FirebaseApp {
  app ??= initializeApp(firebaseConfig);
  return app;
}

/**
 * Single shared Firestore instance with persistent (IndexedDB-backed) local cache enabled,
 * so both study content and progress keep working offline after the first successful fetch.
 * Must be the only place calling initializeFirestore/getFirestore for this app — Firestore
 * throws if you try to configure it twice.
 */
export function getDb(): Firestore {
  db ??= initializeFirestore(getFirebaseApp(), {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
  });
  return db;
}
