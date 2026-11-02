import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "БытТехОпт — техника и товары для дома",
    short_name: "БытТехОпт",
    lang: "ru",
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#F2F5FF",
    theme_color: "#4263EB",
    icons: [
      { src: "/static/brand/browser-icon-v3-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/static/brand/browser-icon-v3-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
