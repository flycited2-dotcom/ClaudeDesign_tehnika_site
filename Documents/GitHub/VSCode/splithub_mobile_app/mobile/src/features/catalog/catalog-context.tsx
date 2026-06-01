import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loadCatalog } from './catalog-repository';
import type { CatalogSnapshot } from './types';

type CatalogContextValue = {
  snapshot: CatalogSnapshot | null;
  loading: boolean;
  offline: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadCatalog();
      setSnapshot(result.snapshot);
      setOffline(result.offline);
    } catch {
      setError('Не удалось загрузить каталог');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ snapshot, loading, offline, error, refresh }),
    [snapshot, loading, offline, error, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error('useCatalog must be used inside CatalogProvider');
  }
  return value;
}
