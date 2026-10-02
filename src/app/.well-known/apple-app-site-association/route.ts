import { appleAppSiteAssociation } from "@/server/app-links";

// iOS universal links. Apple's CDN fetches this from trysidekick.ca and
// www.trysidekick.ca, and only accepts a 200 JSON response with no redirect.
export function GET() {
  const body = appleAppSiteAssociation();
  return body ? Response.json(body) : new Response("Not found", { status: 404 });
}
