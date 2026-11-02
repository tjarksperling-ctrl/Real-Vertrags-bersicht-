import { useMemo, useSyncExternalStore } from 'react';
import type * as Y from 'yjs';

/** Liefert einen Zähler, der sich bei jeder Änderung des Dokuments erhöht (für Neuberechnung). */
export function useDocVersion(doc: Y.Doc | null): number {
  const store = useMemo(() => {
    let v = 0;
    return {
      subscribe(cb: () => void) {
        if (!doc) return () => {};
        const h = () => {
          v++;
          cb();
        };
        doc.on('update', h);
        return () => doc.off('update', h);
      },
      get: () => v,
    };
  }, [doc]);
  return useSyncExternalStore(store.subscribe, store.get);
}
