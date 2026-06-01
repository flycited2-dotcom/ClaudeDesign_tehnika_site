import { api } from '../../lib/api';
import { catalogStorage } from '../../lib/storage';
import type { CatalogSnapshot } from './types';

type Dependencies = {
  fetchRemote: () => Promise<CatalogSnapshot>;
  readCache: () => Promise<CatalogSnapshot | null>;
  writeCache: (snapshot: CatalogSnapshot) => Promise<unknown>;
};

const defaults: Dependencies = {
  fetchRemote: () => api<CatalogSnapshot>('catalog'),
  readCache: catalogStorage.read,
  writeCache: catalogStorage.write,
};

export async function loadCatalog(dependencies: Dependencies = defaults) {
  try {
    const snapshot = await dependencies.fetchRemote();
    await dependencies.writeCache(snapshot);
    return { snapshot, offline: false };
  } catch (error) {
    const snapshot = await dependencies.readCache();
    if (!snapshot) {
      throw error;
    }
    return { snapshot, offline: true };
  }
}
