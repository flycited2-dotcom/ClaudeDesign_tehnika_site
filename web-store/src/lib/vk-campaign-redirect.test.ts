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

  it("rejects unknown codes instead of becoming an open redirect", () => {
    expect(
      buildVkCampaignDestination("https://evil.example", "https://splithome.ru/go/x"),
    ).toBeNull();
  });
});
