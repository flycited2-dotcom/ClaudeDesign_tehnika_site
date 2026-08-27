import { NextResponse, type NextRequest } from "next/server";
import { buildVkCampaignDestination } from "@/lib/vk-campaign-redirect";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const publicUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) publicUrl.host = forwardedHost.split(",", 1)[0].trim();
  if (forwardedProto) publicUrl.protocol = `${forwardedProto.split(",", 1)[0].trim()}:`;
  const destination = buildVkCampaignDestination(code, publicUrl.toString());

  if (!destination) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(destination, 307);
}
