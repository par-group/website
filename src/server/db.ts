import "server-only";
import { createClient, type Client, type InArgs } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

// Local dev: a SQLite file in ./data (no setup). Deployed (Vercel's disk is
// read-only): a hosted Turso database via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
// The table name is prefixed so the website can share the app's Turso database.
export const IS_HOSTED_DB = !!process.env.TURSO_DATABASE_URL;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id                    TEXT PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,  -- normalized: trimmed, lower-case
  school                TEXT,
  platform              TEXT,                  -- 'ios' | 'android'
  source                TEXT,                  -- ?ref=, utm_* or referring site
  removal_token_hash    TEXT,                  -- SHA-256 of the "not you? remove it" link's token
  confirmation_sent_at  INTEGER,               -- when the confirmation email was accepted for delivery
  created_at            INTEGER NOT NULL,      -- epoch milliseconds
  updated_at            INTEGER NOT NULL
)`;

// Columns added after the first release. Older databases gain them in place;
// nothing is dropped or rewritten.
const ADDED_COLUMNS: [name: string, definition: string][] = [
  ["removal_token_hash", "TEXT"],
  ["confirmation_sent_at", "INTEGER"],
];

async function columns(client: Client): Promise<Set<string>> {
  return new Set((await client.execute("PRAGMA table_info(waitlist_signups)")).rows.map((c) => String(c.name)));
}

async function migrate(client: Client) {
  await client.execute(SCHEMA);
  const existing = await columns(client);
  for (const [name, definition] of ADDED_COLUMNS) {
    if (existing.has(name)) continue;
    try {
      await client.execute(`ALTER TABLE waitlist_signups ADD COLUMN ${name} ${definition}`);
    } catch (error) {
      // Another server instance may have added it first.
      if (!(await columns(client)).has(name)) throw error;
    }
  }
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_removal_token ON waitlist_signups(removal_token_hash)");
}

const globalForDb = globalThis as unknown as { __sidekickSiteDb?: Promise<Client> };

async function init(): Promise<Client> {
  if (!IS_HOSTED_DB && process.env.VERCEL) {
    throw new Error("TURSO_DATABASE_URL is not set. Vercel's filesystem is read-only, so the waitlist needs a hosted database (see docs/deployment.md).");
  }
  let url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    url = `file:${path.join(dir, "waitlist.db")}`;
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await migrate(client);
  return client;
}

/** Lazily connects and creates or updates the table, once per server instance. */
export function db(): Promise<Client> {
  globalForDb.__sidekickSiteDb ??= init().catch((e) => {
    globalForDb.__sidekickSiteDb = undefined; // retry on the next request
    throw e;
  });
  return globalForDb.__sidekickSiteDb;
}

export async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const { rows } = await (await db()).execute({ sql, args });
  return rows.map((r) => ({ ...r }) as T);
}

export async function run(sql: string, args: InArgs = []): Promise<{ changes: number }> {
  return { changes: (await (await db()).execute({ sql, args })).rowsAffected };
}
