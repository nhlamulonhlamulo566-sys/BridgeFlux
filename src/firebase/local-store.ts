'use client';

export type LocalDoc<T = any> = T & {
  id: string;
  createdAt: { seconds: number };
};

const getLocalStorageKey = (collectionName: string, token: string) => `bf_local_${token}_${collectionName}`;

export function loadLocalDocs<T = any>(collectionName: string, token: string): LocalDoc<T>[] {
  if (typeof window === 'undefined' || !token) return [];

  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(collectionName, token));
    if (!raw) return [];
    return JSON.parse(raw) as LocalDoc<T>[];
  } catch {
    return [];
  }
}

export function saveLocalDocs<T = any>(collectionName: string, token: string, docs: LocalDoc<T>[]) {
  if (typeof window === 'undefined' || !token) return;
  window.localStorage.setItem(getLocalStorageKey(collectionName, token), JSON.stringify(docs));
}

export function addLocalDoc<T = any>(collectionName: string, token: string, doc: T): LocalDoc<T> {
  const docs = loadLocalDocs<T>(collectionName, token);
  const id = `local_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  const createdAt = { seconds: Math.floor(Date.now() / 1000) };
  const newDoc = { ...doc, id, createdAt } as LocalDoc<T>;

  docs.unshift(newDoc);
  saveLocalDocs(collectionName, token, docs);
  return newDoc;
}

export function deleteLocalDoc(collectionName: string, token: string, id: string) {
  const docs = loadLocalDocs(collectionName, token).filter((item) => item.id !== id);
  saveLocalDocs(collectionName, token, docs);
}
