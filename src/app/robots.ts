import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// The domain's only robots.txt. /app-demo (the app, proxied from its own project)
// repeats this site's pages and holds signed-in screens, so it isn't crawled.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/app-demo"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
