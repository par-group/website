import "server-only";
import { createClient, type Client } from "@libsql/client";
import { db } from "@/server/db";

// The app's database, which the metrics dashboard reads (and never writes).
// Either its own connection, APP_DATABASE_URL with APP_DATABASE_AUTH_TOKEN
// (ideally a read-only token), or the waitlist's database when the website
// shares the app's, which is detected by the app's users table being there.

export type AppDatabase = { client: Client; via: "APP_DATABASE_URL" | "shared with the waitlist" };

const globalForAppDb = globalThis as unknown as { __sidekickAppDb?: Client };

export async function appDb(): Promise<AppDatabase | null> {
  const url = process.env.APP_DATABASE_URL;
  if (url) {
    globalForAppDb.__sidekickAppDb ??= createClient({ url, authToken: process.env.APP_DATABASE_AUTH_TOKEN });
    return { client: globalForAppDb.__sidekickAppDb, via: "APP_DATABASE_URL" };
  }
  const shared = await db();
  const { rows } = await shared.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'");
  return rows.length ? { client: shared, via: "shared with the waitlist" } : null;
}
