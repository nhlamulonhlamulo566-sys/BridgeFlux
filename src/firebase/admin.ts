import fs from 'fs';
import path from 'path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

function loadServiceAccountKey(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  const candidatePath = path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
  if (fs.existsSync(candidatePath)) {
    return JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
  }

  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_KEY is set, but its value is not valid JSON and the file path does not exist: ' + candidatePath
  );
}

function createAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = loadServiceAccountKey(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
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
