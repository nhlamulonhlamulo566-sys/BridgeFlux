
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextProps {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  authUser: User | null;
  authReady: boolean;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  firebaseApp: null,
  firestore: null,
  auth: null,
  authUser: null,
  authReady: false,
});

export const FirebaseProvider: React.FC<{
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  children: React.ReactNode;
}> = ({ firebaseApp, firestore, auth, children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        setAuthReady(true);
        return;
      }

      try {
        await signInAnonymously(auth);
      } catch {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth, authUser, authReady }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useAuth = () => useContext(FirebaseContext).auth;
