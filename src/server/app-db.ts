import "server-only";
import { createClient, type Client } from "@libsql/client";
import { db } from "@/server/db";

// The app's database, which the metrics dashboard reads (and never writes).
// The plan is for the app to launch on the waitlist's database, so that's the
// default. APP_DATABASE_URL with APP_DATABASE_AUTH_TOKEN (ideally a read-only
// token) points somewhere else, or at the same database with read-only access.

export type AppDatabase = {
  client: Client;
  via: "APP_DATABASE_URL" | "shared with the waitlist";
  /** Whether the app's tables are there yet: they're created when the app first runs on the database. */
  ready: boolean;
};

const globalForAppDb = globalThis as unknown as { __sidekickAppDb?: Client };

export async function appDb(): Promise<AppDatabase> {
  const url = process.env.APP_DATABASE_URL;
  if (url) globalForAppDb.__sidekickAppDb ??= createClient({ url, authToken: process.env.APP_DATABASE_AUTH_TOKEN });
  const client = url ? globalForAppDb.__sidekickAppDb! : await db();
  const { rows } = await client.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'");
  return { client, via: url ? "APP_DATABASE_URL" : "shared with the waitlist", ready: rows.length > 0 };
}
