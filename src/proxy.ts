import { hasPassword, passwordRequired } from "@/server/basic-auth";

// /dashboard asks for DASHBOARD_PASSWORD (any username). Without the variable,
// the page itself answers 404.
export function proxy(request: Request) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (password && !hasPassword(request.headers.get("authorization"), password)) return passwordRequired("Sidekick dashboard");
}

export const config = { matcher: ["/dashboard", "/dashboard/:path*"] };
