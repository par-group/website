import { assetLinks } from "@/server/app-links";

// Android App Links. Android checks this on each domain the app claims, and
// only accepts a 200 JSON response with no redirect.
export function GET() {
  const body = assetLinks();
  return body ? Response.json(body) : new Response("Not found", { status: 404 });
}
