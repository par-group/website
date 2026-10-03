/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createClient } = require("@libsql/client");
const { load, useTempWorkspace } = require("./support/harness.cjs");

const workspace = useTempWorkspace("dashboard");
after(() => workspace.cleanup());

const { weekStart, recentWeeks, DAY } = load("@/lib/weeks");
const { addSignup } = load("@/server/waitlist");
const { loadDashboard } = load("@/server/metrics");
const { proxy } = load("@/proxy");

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 9, 3, 15); // Saturday Oct 3, 11am in Toronto
const T0 = Date.UTC(2026, 8, 21, 16); // Monday Sep 21, noon in Toronto: the last full week (index 6)
const LAST_FULL = 6;

// The columns of the app's schema (app-demo/src/server/db/schema.ts) the dashboard reads.
const APP_SCHEMA = `
CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, profile_complete INTEGER NOT NULL DEFAULT 0, is_sandbox INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE swipes (id TEXT PRIMARY KEY, swiper_id TEXT NOT NULL, swipee_id TEXT NOT NULL, direction TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE matches (id TEXT PRIMARY KEY, user_a_id TEXT NOT NULL, user_b_id TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE comments (id TEXT PRIMARY KEY, author_id TEXT NOT NULL, target_user_id TEXT NOT NULL, created_at INTEGER NOT NULL, replied_at INTEGER);
CREATE TABLE messages (id TEXT PRIMARY KEY, match_id TEXT NOT NULL, sender_id TEXT NOT NULL, created_at INTEGER NOT NULL);
`;

describe("weeks", () => {
  test("start on Monday at midnight in Toronto, across daylight saving", () => {
    assert.equal(weekStart(Date.UTC(2026, 9, 1, 12)), Date.UTC(2026, 8, 28, 4)); // EDT: UTC-4
    assert.equal(weekStart(Date.UTC(2026, 8, 28, 4)), Date.UTC(2026, 8, 28, 4)); // the first instant of the week
    assert.equal(weekStart(Date.UTC(2026, 8, 28, 3, 59)), Date.UTC(2026, 8, 21, 4)); // Sunday 11:59pm belongs to the week before
    assert.equal(weekStart(Date.UTC(2026, 10, 4, 12)), Date.UTC(2026, 10, 2, 5)); // EST after Nov 1: UTC-5
  });

  test("list the recent weeks oldest first, with only the current one unfinished", () => {
    const weeks = recentWeeks(NOW, 8);
    assert.equal(weeks.length, 8);
    assert.equal(weeks[7].start, Date.UTC(2026, 8, 28, 4));
    assert.equal(weeks[7].label, "Sep 28");
    assert.deepEqual(
      weeks.map((w) => w.complete),
      [true, true, true, true, true, true, true, false],
    );
    for (let i = 1; i < 8; i++) assert.equal(weeks[i].start, weeks[i - 1].end);
  });
});

describe("the dashboard", () => {
  before(async () => {
    process.env.APP_DATABASE_URL = `file:${path.join(workspace.dir, "app.db")}`;
    const app = createClient({ url: process.env.APP_DATABASE_URL });
    await app.executeMultiple(APP_SCHEMA);
    await app.batch(
      [
        // A finished their profile and came back on days 1 and 7; B finished but didn't come back; C never finished.
        ["INSERT INTO users VALUES ('a', 'Ana@My.YorkU.ca', 1, 0, ?)", [T0]],
        ["INSERT INTO users VALUES ('b', 'ben@my.yorku.ca', 1, 0, ?)", [T0 + HOUR]],
        ["INSERT INTO users VALUES ('c', 'cy@my.yorku.ca', 0, 0, ?)", [T0 + 2 * HOUR]],
        // Sample profiles: busy, and never counted.
        ["INSERT INTO users VALUES ('s1', 'demo@my.yorku.ca', 1, 1, ?)", [T0]],
        ["INSERT INTO users VALUES ('s2', 'seed@example.invalid', 1, 1, ?)", [T0]],
        // A and B become friends 10h after A signed up (9h after B), and chat 10 messages.
        ["INSERT INTO matches VALUES ('ab', 'a', 'b', ?)", [T0 + 10 * HOUR]],
        ...Array.from({ length: 10 }, (_, i) => ["INSERT INTO messages VALUES (?, 'ab', ?, ?)", [`m${i}`, i % 2 ? "a" : "b", T0 + 10 * HOUR + i * 60_000]]),
        ["INSERT INTO matches VALUES ('ss', 's1', 's2', ?)", [T0]],
        // One of two real comments got a reply; the sample profile's replied comment doesn't count.
        ["INSERT INTO comments VALUES ('k1', 'a', 'b', ?, ?)", [T0 + 3 * DAY, T0 + 3 * DAY + HOUR]],
        ["INSERT INTO comments VALUES ('k2', 'b', 'a', ?, NULL)", [T0 + 3 * DAY]],
        ["INSERT INTO comments VALUES ('k3', 's1', 'a', ?, ?)", [T0 + DAY, T0 + DAY + HOUR]],
        ["INSERT INTO swipes VALUES ('w1', 'a', 'c', 'friend', ?)", [T0 + 1.5 * DAY]],
        ["INSERT INTO swipes VALUES ('w2', 'a', 'c', 'pass', ?)", [T0 + 7.5 * DAY]],
        ...Array.from({ length: 12 }, (_, i) => ["INSERT INTO swipes VALUES (?, 's1', 's2', 'friend', ?)", [`ws${i}`, T0 + i * DAY]]),
      ].map(([sql, args]) => ({ sql, args })),
      "write",
    );
    app.close();

    await addSignup("ana@my.yorku.ca", null, T0); // has an account (email matched case-insensitively)
    await addSignup("fan@gmail.com", "invite", T0 + HOUR);
    await addSignup("demo@my.yorku.ca", null, T0 - 7 * DAY); // a sample account doesn't count as converting
  });

  test("counts the waitlist and how much of it has an account", async () => {
    const { waitlist } = await loadDashboard(NOW);
    assert.equal(waitlist.total, 3);
    assert.equal(waitlist.signups[LAST_FULL], 2);
    assert.equal(waitlist.signups[LAST_FULL - 1], 1);
    assert.equal(waitlist.fromInvites[LAST_FULL], 1);
    assert.equal(waitlist.withAccount, 1);
    assert.deepEqual(waitlist.toAccount[LAST_FULL], { count: 1, total: 2 });
    assert.deepEqual(waitlist.toAccount[LAST_FULL - 1], { count: 0, total: 1 });
  });

  test("measures the week's signups, leaving out sample profiles", async () => {
    const { app } = await loadDashboard(NOW);
    assert.equal(app.ok, true, app.reason);
    assert.equal(app.accounts, 3);
    const m = app.metrics;
    assert.equal(m.newAccounts[LAST_FULL], 3);
    assert.deepEqual(m.onboarding[LAST_FULL], { count: 2, total: 3 });
    assert.deepEqual(m.timeToFirstConnection[LAST_FULL], { ms: 9.5 * HOUR, n: 2 });
    assert.deepEqual(m.connectedWithin7Days[LAST_FULL], { count: 2, total: 2 });
    assert.deepEqual(m.retention.d1[LAST_FULL], { count: 1, total: 3 });
    assert.deepEqual(m.retention.d7[LAST_FULL], { count: 1, total: 3 });
    assert.equal(m.retention.d30[LAST_FULL], null, "nobody has had 30 days yet");
    assert.deepEqual(m.replyRate[LAST_FULL], { count: 1, total: 2 });
    assert.deepEqual(m.longChats[LAST_FULL], { count: 1, total: 1 });
    assert.equal(m.onboarding[LAST_FULL - 1], null, "no signups that week");
    assert.equal(m.newAccounts[LAST_FULL - 1], 0);
  });

  test("only counts retention for people who've had the whole day", async () => {
    // Two days after A's signup, day 7 hasn't happened for anyone yet.
    const { app } = await loadDashboard(T0 + 2 * DAY + 3 * HOUR);
    assert.deepEqual(app.metrics.retention.d1.at(-1), { count: 1, total: 3 });
    assert.equal(app.metrics.retention.d7.at(-1), null);
    assert.equal(app.metrics.connectedWithin7Days.at(-1), null);
  });

  test("still shows the waitlist when the app's database isn't connected", async () => {
    delete process.env.APP_DATABASE_URL;
    try {
      const { app, waitlist } = await loadDashboard(NOW);
      assert.deepEqual(app, { ok: false, reason: "not connected" });
      assert.equal(waitlist.total, 3);
      assert.equal(waitlist.withAccount, null);
      assert.equal(waitlist.toAccount, null);
    } finally {
      process.env.APP_DATABASE_URL = `file:${path.join(workspace.dir, "app.db")}`;
    }
  });
});

describe("the dashboard password", () => {
  const request = (password) =>
    new Request("http://localhost/dashboard", password ? { headers: { authorization: `Basic ${Buffer.from(`me:${password}`).toString("base64")}` } } : {});

  test("is asked for, and a wrong one is refused", () => {
    process.env.DASHBOARD_PASSWORD = "correct horse";
    const res = proxy(request());
    assert.equal(res.status, 401);
    assert.match(res.headers.get("www-authenticate"), /^Basic /);
    assert.equal(proxy(request("wrong")).status, 401);
    assert.equal(proxy(request("correct horse")), undefined);
  });

  test("isn't asked for when none is set, and the page then doesn't exist", () => {
    delete process.env.DASHBOARD_PASSWORD;
    assert.equal(proxy(request()), undefined);
  });
});
