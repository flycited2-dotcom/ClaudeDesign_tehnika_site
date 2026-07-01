/**
 * Best-effort ping to POST /api/admin/revalidate after a bulk sync finishes,
 * so catalog caches refresh right away instead of waiting for the periodic
 * cache warmer. Never throws — a sync that completed successfully shouldn't
 * fail just because the live server was briefly unreachable.
 */
export async function notifyRevalidate(): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  const siteUrl = process.env.SITE_URL;
  if (!secret || !siteUrl) return;

  try {
    const response = await fetch(new URL("/api/admin/revalidate", siteUrl), {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    });
    if (!response.ok) {
      console.warn(`[notify-revalidate] responded ${response.status}`);
    }
  } catch (error) {
    console.warn("[notify-revalidate] failed", error);
  }
}
