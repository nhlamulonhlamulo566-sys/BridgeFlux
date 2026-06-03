import fs from 'fs';
import path from 'path';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firestoreInstance: ReturnType<typeof getFirestore> | null = null;

function loadServiceAccountKey(value: string) {
  const trimmed = value.trim();

  // Try base64 decoding first (to handle base64-encoded service account)
  if (!trimmed.startsWith('{') && !trimmed.includes('\n') && trimmed.length > 100) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      if (decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded);
        // Ensure private_key uses actual newlines
        if (parsed.private_key && typeof parsed.private_key === 'string') {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
      }
    } catch (error) {
      // Not base64, continue with other methods
    }
  }

  // Handle JSON
  if (trimmed.startsWith('{')) {
    try {
      const cleanedValue = trimmed.replace(/^\uFEFF/, '');
      const parsed = JSON.parse(cleanedValue);
      
      // Ensure private_key uses actual newlines, not escaped ones
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      
      return parsed;
    } catch (error) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error, 'rawPrefix=', trimmed.slice(0, 200));
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON. ' +
        'Ensure the secret is the full service account JSON text, not a path or malformed object.'
      );
    }
  }

  // Handle file path
  const candidatePath = path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
  if (fs.existsSync(candidatePath)) {
    const fileContent = fs.readFileSync(candidatePath, 'utf8');
    const parsed = JSON.parse(fileContent);
    
    // Ensure private_key uses actual newlines
    if (parsed.private_key && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    
    return parsed;
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
