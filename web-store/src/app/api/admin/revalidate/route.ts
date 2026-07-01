import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand cache invalidation for the bulk ITP sync scripts (sync-products,
 * sync-prices, sync-images, sync-categories). Those run as standalone `tsx`
 * processes (cron or manual) outside the running Next.js server, so they
 * can't call revalidateTag/revalidatePath directly the way admin server
 * actions do — this HTTP endpoint is the only way for them to ask the live
 * server to drop its unstable_cache entries right after a sync finishes,
 * instead of waiting out the cache warmer's periodic cycle.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // { expire: 0 } (not the "max" profile) — this is a webhook from an external
  // sync process that needs the cache gone now, not stale-while-revalidate.
  revalidateTag("catalog", { expire: 0 });
  revalidateTag("products", { expire: 0 });

  return NextResponse.json({ revalidated: true });
}
