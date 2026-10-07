/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { load, useTempWorkspace } = require("./support/harness.cjs");

const workspace = useTempWorkspace("waitlist-dashboard");
after(() => workspace.cleanup());

const { DAY } = load("@/lib/calendar");
const { parseSignupFilters, signupFiltersQuery, isFiltered, NO_SOURCE, PAGE_SIZE } = load("@/lib/signup-filters");
const { db } = load("@/server/db");
const { findSignups, allMatchingSignups, waitlistSummary } = load("@/server/waitlist-insights");
const { systemStatus } = load("@/server/status");
const download = load("@/app/dashboard/waitlist/download/route");

const NOW = Date.UTC(2026, 9, 3, 15); // Saturday Oct 3, 11am in Toronto
const filters = (overrides = {}) => ({ q: "", source: null, school: null, platform: null, page: 1, ...overrides });
const emails = (rows) => rows.map((r) => r.email);

let seq = 0;
async function signup({ email, school = null, platform = null, source = null, at = NOW - DAY }) {
  await (
    await db()
  ).execute({
    sql: "INSERT INTO waitlist_signups (id, email, school, platform, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [`s${++seq}`, email, school, platform, source, at, at],
  });
}

describe("the list's filters", () => {
  test("are read from the query string, ignoring anything unexpected", () => {
    assert.deepEqual(parseSignupFilters({}), filters());
    assert.deepEqual(parseSignupFilters({ q: "  maya ", source: "poster", school: "york", platform: "ios", page: "3" }), {
      q: "maya",
      source: "poster",
      school: "york",
      platform: "ios",
      page: 3,
    });
    assert.deepEqual(parseSignupFilters({ school: "harvard", platform: "windows", page: "-2", q: ["a", "b"] }), filters({ q: "a" }));
    assert.equal(parseSignupFilters({ q: "x".repeat(500) }).q.length, 100);
    assert.equal(parseSignupFilters({ page: "abc" }).page, 1);
  });

  test("round-trip through links, leaving out page 1", () => {
    const f = filters({ q: "a b&c", source: NO_SOURCE, platform: "none", page: 2 });
    assert.deepEqual(parseSignupFilters(Object.fromEntries(new URLSearchParams(signupFiltersQuery(f)))), f);
    assert.equal(signupFiltersQuery(filters()), "");
    assert.equal(signupFiltersQuery(filters({ page: 1 })), "");
    assert.equal(isFiltered(filters()), false);
    assert.equal(isFiltered(filters({ platform: "android" })), true);
  });
});

describe("the waitlist page", () => {
  before(async () => {
    await signup({ email: "maya@my.yorku.ca", school: "York University", platform: "ios", source: "poster-vari-hall" });
    await signup({ email: "jo_doe@gmail.com", school: "Toronto Metropolitan University", platform: "android", source: "instagram-bio" });
    await signup({ email: "sam@gmail.com", source: "invite", at: NOW - 10 * DAY });
    await signup({ email: "100percent@gmail.com", school: '=HYPERLINK("http://evil.example")' });
    // Late Saturday night in Toronto is Sunday in UTC: it belongs to Saturday.
    await signup({ email: "night@my.yorku.ca", school: "York University", platform: "ios", at: Date.UTC(2026, 9, 4, 3, 30) - 7 * DAY });
    for (let i = 0; i < 50; i++)
      await signup({ email: `bulk${String(i).padStart(2, "0")}@example.com`, source: `ref-${i % 9}`, at: NOW - 40 * DAY - i });
  });

  test("searches email, school and source, taking % and _ literally", async () => {
    assert.deepEqual(emails((await findSignups(filters({ q: "MAYA" }))).rows), ["maya@my.yorku.ca"]);
    assert.deepEqual(emails((await findSignups(filters({ q: "metropolitan" }))).rows), ["jo_doe@gmail.com"]);
    assert.deepEqual(emails((await findSignups(filters({ q: "vari-hall" }))).rows), ["maya@my.yorku.ca"]);
    assert.deepEqual(emails((await findSignups(filters({ q: "o_d" }))).rows), ["jo_doe@gmail.com"]);
    assert.equal((await findSignups(filters({ q: "%" }))).total, 0);
    assert.equal((await findSignups(filters({ q: "100%" }))).total, 0);
  });

  test("filters by source, school and phone", async () => {
    assert.deepEqual(emails((await findSignups(filters({ source: "invite" }))).rows), ["sam@gmail.com"]);
    assert.deepEqual(emails((await findSignups(filters({ source: NO_SOURCE }))).rows).sort(), ["100percent@gmail.com", "night@my.yorku.ca"]);
    assert.deepEqual(emails((await findSignups(filters({ school: "york" }))).rows), ["maya@my.yorku.ca", "night@my.yorku.ca"]);
    assert.deepEqual(emails((await findSignups(filters({ school: "other" }))).rows).sort(), ["100percent@gmail.com", "jo_doe@gmail.com"]);
    assert.equal((await findSignups(filters({ school: "none" }))).total, 51);
    assert.deepEqual(emails((await findSignups(filters({ platform: "android" }))).rows), ["jo_doe@gmail.com"]);
    assert.deepEqual(emails((await findSignups(filters({ school: "york", platform: "ios", q: "night" }))).rows), ["night@my.yorku.ca"]);
  });

  test("pages through everyone, newest first", async () => {
    const first = await findSignups(filters());
    assert.equal(first.total, 55);
    assert.equal(first.pages, Math.ceil(55 / PAGE_SIZE));
    assert.equal(first.rows.length, PAGE_SIZE);
    assert.ok(first.rows.every((r, i) => i === 0 || first.rows[i - 1].created_at >= r.created_at));
    const second = await findSignups(filters({ page: 2 }));
    assert.equal(second.rows.length, 5);
    assert.equal(second.rows.at(-1).email, "bulk49@example.com");
    assert.equal((await findSignups(filters({ page: 99 }))).page, 2, "a page past the end shows the last one");
    assert.equal((await allMatchingSignups(filters())).length, 55);
  });

  test("sums up the waitlist", async () => {
    const s = await waitlistSummary(30, NOW);
    assert.equal(s.total, 55);
    assert.equal(s.last7, 4, "the last 7 days include late Saturday Sep 26");
    assert.equal(s.previous7, 1);
    assert.equal(s.emailed, 0);
    assert.equal(s.answeredPhone, 3);
    assert.equal(s.iphone, 2);

    assert.equal(s.daily.length, 30);
    assert.equal(s.daily.at(-1).day.label, "Oct 3");
    assert.equal(s.daily.at(-1).day.complete, false);
    assert.equal(s.daily.find((d) => d.day.label === "Oct 2").count, 3);
    assert.equal(s.daily.find((d) => d.day.label === "Sep 26").count, 1, "11:30pm Saturday in Toronto counts on Saturday");
    assert.equal(
      s.daily.reduce((sum, d) => sum + d.count, 0),
      5,
      "the bulk signups are older than 30 days",
    );

    assert.equal(s.sources.length, 8, "the 7 largest sources, then everything else");
    assert.deepEqual(s.sources.at(-1), {
      label: "Everything else",
      count: s.total - s.sources.slice(0, 7).reduce((n, x) => n + x.count, 0),
      filters: null,
    });
    assert.equal(
      s.sourceOptions.reduce((n, o) => n + o.count, 0),
      55,
    );
    assert.ok(s.sourceOptions.some((o) => o.value === NO_SOURCE && o.count === 2));
    assert.deepEqual(s.schools[0], { label: "Not answered", count: 51, filters: { school: "none" } });
    assert.deepEqual(
      s.schools.find((x) => x.label === "York University"),
      { label: "York University", count: 2, filters: { school: "york" } },
    );
    assert.deepEqual(
      s.phones.map((p) => [p.label, p.count]),
      [
        ["iPhone", 2],
        ["Android", 1],
        ["Not answered", 52],
      ],
    );
  });
});

describe("the dashboard's download", () => {
  const request = (query = "", password) =>
    new Request(
      `http://localhost/dashboard/waitlist/download${query}`,
      password ? { headers: { authorization: `Basic ${Buffer.from(`me:${password}`).toString("base64")}` } } : {},
    );

  test("doesn't exist without a dashboard password, and asks for it", async () => {
    delete process.env.DASHBOARD_PASSWORD;
    assert.equal((await download.GET(request("", "anything"))).status, 404);
    process.env.DASHBOARD_PASSWORD = "correct horse";
    assert.equal((await download.GET(request())).status, 401);
    assert.equal((await download.GET(request("", "wrong"))).status, 401);
  });

  test("returns the signups matching the list's filters, with formulas defused", async () => {
    process.env.DASHBOARD_PASSWORD = "correct horse";
    const all = await download.GET(request("", "correct horse"));
    assert.equal(all.status, 200);
    assert.match(all.headers.get("content-type"), /^text\/csv/);
    assert.match(all.headers.get("content-disposition"), /sidekick-waitlist-\d{4}-\d{2}-\d{2}\.csv/);
    assert.equal((await all.text()).trim().split("\r\n").length, 56);

    const filtered = await download.GET(request("?school=other", "correct horse"));
    assert.match(filtered.headers.get("content-disposition"), /sidekick-waitlist-filtered-/);
    const lines = (await filtered.text()).trim().split("\r\n");
    assert.equal(lines.length, 3);
    assert.ok(lines.some((l) => l.includes(`"'=HYPERLINK(""http://evil.example"")"`)));
  });
});

describe("the system status", () => {
  test("reports the waitlist database, and no app data before launch", async () => {
    delete process.env.APP_DATABASE_URL;
    const status = await systemStatus();
    assert.deepEqual(status.database, { ok: true, detail: "connected" });
    assert.deepEqual(status.appDatabase, { ok: false, detail: "no app tables yet (shared with the waitlist)" });
    assert.equal(typeof status.checkedAt, "number");
  });
});
