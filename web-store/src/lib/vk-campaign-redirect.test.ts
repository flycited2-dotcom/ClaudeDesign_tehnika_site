import { describe, expect, it } from "vitest";
import { buildVkCampaignDestination } from "./vk-campaign-redirect";

describe("buildVkCampaignDestination", () => {
  it("expands a public short code into the service page with attribution", () => {
    const url = buildVkCampaignDestination(
      "vkp_13",
      "https://splithome.ru/go/vkp_13",
    );

    expect(url?.pathname).toBe("/service");
    expect(url?.searchParams.get("utm_source")).toBe("vk");
    expect(url?.searchParams.get("utm_medium")).toBe("organic_social");
    expect(url?.searchParams.get("utm_campaign")).toBe("content_factory");
    expect(url?.searchParams.get("utm_content")).toBe("vkp_13");
  });

  it("expands compact service codes", () => {
    const url = buildVkCampaignDestination("svc14", "https://splithome.ru/go/svc14");
    expect(url?.pathname).toBe("/service");
    expect(url?.searchParams.get("utm_content")).toBe("vkp_14");
  });

  it("opens the relevant catalog assortment with one compact link", () => {
    const url = buildVkCampaignDestination("st26", "https://splithome.ru/go/st26");
    expect(url?.pathname).toBe("/search");
    expect(url?.searchParams.get("q")).toBe("стабилизатор");
    expect(url?.searchParams.get("utm_content")).toBe("vkp_26");
  });

  it("keeps previously issued service links working", () => {
    const url = buildVkCampaignDestination(
      "svc_vkp_14",
      "https://splithome.ru/go/svc_vkp_14",
    );
    expect(url?.pathname).toBe("/service");
    expect(url?.searchParams.get("utm_content")).toBe("vkp_14");
  });

  it("rejects unknown codes instead of becoming an open redirect", () => {
    expect(
      buildVkCampaignDestination("https://evil.example", "https://splithome.ru/go/x"),
    ).toBeNull();
  });
});
