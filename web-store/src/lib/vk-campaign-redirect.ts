const VK_PLAN_CODE = /^vkp_(\d+)$/;

export function buildVkCampaignDestination(code: string, requestUrl: string): URL | null {
  if (!VK_PLAN_CODE.test(code)) return null;

  const destination = new URL("/service", requestUrl);
  destination.searchParams.set("utm_source", "vk");
  destination.searchParams.set("utm_medium", "organic_social");
  destination.searchParams.set("utm_campaign", "content_factory");
  destination.searchParams.set("utm_content", code);
  return destination;
}
