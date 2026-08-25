import { NextResponse, type NextRequest } from "next/server";
import { buildVkCampaignDestination } from "@/lib/vk-campaign-redirect";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const destination = buildVkCampaignDestination(code, request.url);

  if (!destination) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(destination, 307);
}
