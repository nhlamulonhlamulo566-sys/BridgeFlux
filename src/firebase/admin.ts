import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

function createAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  return initializeApp({ credential: applicationDefault() });
}

export function getAdminFirestore() {
  if (!firestoreInstance) {
    createAdminApp();
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}
