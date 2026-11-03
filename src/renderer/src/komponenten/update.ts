/** Update-Stand aus dem Hauptprozess (M5c) – für Seitenleiste und Einstellungen → Allgemein. */
import { useEffect, useState } from 'react';
import type { UpdateStand } from '../../../shared/update/update';

export function useUpdate(): UpdateStand | null {
  const [stand, setStand] = useState<UpdateStand | null>(null);
  useEffect(() => {
    let aktiv = true;
    void window.api.updateStand().then((s) => aktiv && setStand(s));
    const weg = window.api.aufUpdate(setStand);
    return () => {
      aktiv = false;
      weg();
    };
  }, []);
  return stand;
}
