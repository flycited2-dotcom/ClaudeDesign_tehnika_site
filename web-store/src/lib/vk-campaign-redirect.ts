const LEGACY_VK_PLAN_CODE = /^(?:svc_)?vkp_(\d+)$/;
const SHORT_VK_PLAN_CODE = /^(svc|ac|hp|rc|vt|st|ups)(\d+)$/;

const catalogQueries: Record<string, string> = {
  ac: "кондиционер",
  hp: "тепловой насос",
  rc: "рекуператор",
  vt: "вентиляция",
  st: "стабилизатор",
  ups: "источник бесперебойного питания",
};

export function buildVkCampaignDestination(code: string, requestUrl: string): URL | null {
  const legacy = code.match(LEGACY_VK_PLAN_CODE);
  const short = code.match(SHORT_VK_PLAN_CODE);
  if (!legacy && !short) return null;

  const intent = short?.[1] ?? "svc";
  const planId = legacy?.[1] ?? short?.[2];
  const destination = new URL(intent === "svc" ? "/service" : "/search", requestUrl);
  const catalogQuery = catalogQueries[intent];
  if (catalogQuery) destination.searchParams.set("q", catalogQuery);

  destination.searchParams.set("utm_source", "vk");
  destination.searchParams.set("utm_medium", "organic_social");
  destination.searchParams.set("utm_campaign", "content_factory");
  destination.searchParams.set("utm_content", `vkp_${planId}`);
  return destination;
}
