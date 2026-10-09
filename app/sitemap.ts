import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { postSlugs } from "@/lib/posts";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "research/", "about/", "careers/", "pilot/"];
  return [
    ...pages.map((p) => ({ url: `${SITE.url}/${p}` })),
    ...postSlugs().map((s) => ({ url: `${SITE.url}/research/${s}/` })),
  ];
}
