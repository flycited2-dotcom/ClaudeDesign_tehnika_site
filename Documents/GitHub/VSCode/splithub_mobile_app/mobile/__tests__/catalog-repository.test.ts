import { loadCatalog } from '../src/features/catalog/catalog-repository';

test('returns cached snapshot when network fails', async () => {
  const cached = { version: 'cached', updated_at: '2026-06-01T00:00:00Z', products: [] };
  const result = await loadCatalog({
    fetchRemote: async () => {
      throw new Error('offline');
    },
    readCache: async () => cached,
    writeCache: async () => undefined,
  });

  expect(result).toEqual({ snapshot: cached, offline: true });
});
