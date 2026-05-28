
'use client';

import { useRef, useMemo } from 'react';
import { Query, DocumentReference } from 'firebase/firestore';

export function useMemoFirebase<T extends Query<any> | DocumentReference<any> | null>(
  factory: () => T,
  ...deps: any[]
): T {
  const ref = useRef<T>(null);
  
  // The dependency list is intentionally forwarded from the custom hook caller.
  /* eslint-disable react-hooks/use-memo, react-hooks/exhaustive-deps */
  const memoized = useMemo(() => {
    const next = factory();
    ref.current = next;
    return next;
  }, deps);
  /* eslint-enable react-hooks/use-memo, react-hooks/exhaustive-deps */

  return memoized;
}
