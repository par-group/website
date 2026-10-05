import { DASHBOARD_REALM, hasPassword, passwordRequired } from "@/server/basic-auth";

// /dashboard and everything under it asks for DASHBOARD_PASSWORD (any username).
// Without the variable, the pages themselves answer 404 (src/server/dashboard-auth.ts).
export function proxy(request: Request) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (password && !hasPassword(request.headers.get("authorization"), password)) return passwordRequired(DASHBOARD_REALM);
}

export const config = { matcher: ["/dashboard", "/dashboard/:path*"] };
