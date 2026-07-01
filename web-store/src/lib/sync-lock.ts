// Full products/images syncs walk the entire catalog with one awaited upsert
// per row (no batching) and can run for hours — well past nginx's
// proxy_read_timeout. Without a lock, an admin who sees the request time out
// and clicks "Запустить" again would kick off a second sync of the same type
// racing the first one over the same rows. The lock expires after a few hours
// so a sync killed mid-run (e.g. pm2 stop during a --full-clean deploy) can't
// leave a permanently stuck "running" row that blocks every future sync of
// that type.
export const SYNC_LOCK_STALE_MS = 3 * 60 * 60 * 1000;

export function isFreshRunningLock(startedAt: Date, now: number = Date.now()): boolean {
  return now - startedAt.getTime() <= SYNC_LOCK_STALE_MS;
}
