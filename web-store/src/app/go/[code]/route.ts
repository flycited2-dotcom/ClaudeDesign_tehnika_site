import { NextResponse, type NextRequest } from "next/server";
import { buildVkCampaignDestination } from "@/lib/vk-campaign-redirect";
import { storefront } from "@/lib/storefront";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  // The application runs behind nginx on an internal :3001 port.  Build
  // campaign redirects from the canonical storefront origin so that proxy
  // headers can never leak that internal address to visitors.
  const destination = buildVkCampaignDestination(code, storefront.siteUrl);

  if (!destination) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(destination, 307);
}
