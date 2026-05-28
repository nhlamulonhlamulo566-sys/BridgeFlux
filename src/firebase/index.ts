
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  return { firebaseApp: app, firestore: db, auth };
}

export async function ensureAnonymousAuth() {
  const { auth } = initializeFirebase();

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }

        try {
          const credential = await signInAnonymously(auth);
          unsubscribe();
          resolve(credential.user);
        } catch (error: any) {
          unsubscribe();
          // If anonymous auth is not enabled or the Firebase Auth configuration is missing,
          // continue with app rendering instead of blocking the UI.
          if (
            error?.code === 'auth/configuration-not-found' ||
            error?.code === 'auth/operation-not-allowed'
          ) {
            resolve(null);
          } else {
            resolve(null);
          }
        }
      },
      () => {
        unsubscribe();
        resolve(null);
      }
    );
  });
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
