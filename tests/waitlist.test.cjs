/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
const { load, useTempWorkspace } = require("./support/harness.cjs");

const workspace = useTempWorkspace("waitlist");
after(() => workspace.cleanup());

const rules = load("@/lib/waitlist");
const { joinWaitlist, saveWaitlistDetails } = load("@/server/actions/waitlist");
const { listSignups } = load("@/server/waitlist");
const exportRoute = load("@/app/api/waitlist/export/route");

const find = async (email) => (await listSignups()).find((s) => s.email === email);

describe("input rules", () => {
  test("emails are trimmed, lower-cased and checked", () => {
    assert.equal(rules.normalizeEmail("  Maya.Chen@My.YorkU.ca "), "maya.chen@my.yorku.ca");
    assert.ok(rules.isValidEmail("maya@my.yorku.ca"));
    assert.ok(rules.isValidEmail("maya+sidekick@gmail.com"));
    for (const bad of ["", "maya", "maya@", "@yorku.ca", "maya@yorku", "ma ya@yorku.ca", `${"a".repeat(250)}@x.ca`]) {
      assert.equal(rules.isValidEmail(bad), false, bad);
    }
  });

  test("only @my.yorku.ca addresses are student emails", () => {
    assert.ok(rules.isStudentEmail("maya@my.yorku.ca"));
    for (const email of ["maya@gmail.com", "prof@yorku.ca", "maya@x.my.yorku.ca", "maya@my.yorku.ca.evil.com", "my.yorku.ca", "@my.yorku.ca"]) {
      assert.equal(rules.isStudentEmail(email), false, email);
    }
  });

  test("masked emails show just enough to recognize them", () => {
    assert.equal(rules.maskEmail("parsasal@my.yorku.ca"), "pa•••@my.yorku.ca");
    assert.equal(rules.maskEmail("ab@my.yorku.ca"), "a•••@my.yorku.ca");
    assert.equal(rules.maskEmail("a@my.yorku.ca"), "•••@my.yorku.ca");
  });

  test("York addresses imply the school", () => {
    assert.equal(rules.schoolForEmail("maya@my.yorku.ca"), rules.YORK);
    assert.equal(rules.schoolForEmail("prof@yorku.ca"), rules.YORK);
    assert.equal(rules.schoolForEmail("maya@gmail.com"), null);
    assert.equal(rules.schoolForEmail("maya@notyorku.ca"), null);
  });

  test("free-text answers are cleaned and capped", () => {
    assert.equal(rules.cleanSchool("  Toronto   Metropolitan\nUniversity "), "Toronto Metropolitan University");
    assert.equal(rules.cleanSchool("x".repeat(200)).length, rules.SCHOOL_MAX);
    assert.equal(rules.cleanSchool("   "), null);
    assert.equal(rules.cleanSchool(42), null);
    assert.equal(rules.cleanPlatform("ios"), "ios");
    assert.equal(rules.cleanPlatform("windows"), null);
    assert.equal(rules.cleanSource("poster-vari-hall<script>"), "poster-vari-hallscript");
  });

  test("the source comes from ?ref, then utm_*, then another site's referrer", () => {
    const own = "www.trysidekick.ca";
    assert.equal(rules.sourceFromLocation("?ref=poster-scott&utm_source=ig", "", own), "poster-scott");
    assert.equal(rules.sourceFromLocation("?utm_source=instagram&utm_campaign=frosh", "", own), "instagram/frosh");
    assert.equal(rules.sourceFromLocation("", "https://www.instagram.com/p/abc", own), "instagram.com");
    assert.equal(rules.sourceFromLocation("", "https://trysidekick.ca/safety", own), null);
    assert.equal(rules.sourceFromLocation("", "", own), null);
  });
});

describe("joining the waitlist", () => {
  test("stores a normalized email with its source, and pre-fills York", async () => {
    const res = await joinWaitlist({ email: " Maya.Chen@My.YorkU.ca", source: "poster-vari-hall" });
    assert.equal(res.ok, true);
    assert.equal(res.school, rules.YORK);
    const row = await find("maya.chen@my.yorku.ca");
    assert.equal(row.id, res.id);
    assert.equal(row.school, rules.YORK);
    assert.equal(row.source, "poster-vari-hall");
  });

  test("signing up twice is fine: it says so, and keeps the first source", async () => {
    const first = await joinWaitlist({ email: "jordan@my.yorku.ca", source: "instagram" });
    const second = await joinWaitlist({ email: "JORDAN@my.yorku.ca", source: "tiktok" });
    assert.equal(first.alreadyJoined, false);
    assert.equal(second.ok, true);
    assert.equal(second.alreadyJoined, true, "the page says this email had already signed up");
    assert.equal(second.id, first.id);
    const rows = (await listSignups()).filter((s) => s.email === "jordan@my.yorku.ca");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].source, "instagram");
  });

  test("rejects invalid input without storing anything", async () => {
    const before = (await listSignups()).length;
    for (const input of [{ email: "not-an-email" }, { email: 12 }, {}]) {
      const res = await joinWaitlist(input);
      assert.equal(res.ok, false);
      assert.match(res.error, /valid email/);
    }
    assert.equal((await listSignups()).length, before);
  });

  test("only takes York student emails", async () => {
    const before = (await listSignups()).length;
    for (const email of ["sam@gmail.com", "prof@yorku.ca", "a@b.my.yorku.ca", "a@my.yorku.ca.example.com", "a@myyorku.ca"]) {
      const res = await joinWaitlist({ email });
      assert.deepEqual(res, { ok: false, error: rules.STUDENTS_ONLY }, email);
    }
    assert.equal((await listSignups()).length, before);
  });

  test("the honeypot looks like a success but stores nothing", async () => {
    const res = await joinWaitlist({ email: "bot@my.yorku.ca", website: "https://spam.example" });
    assert.equal(res.ok, true);
    assert.equal(res.alreadyJoined, false);
    assert.equal(await find("bot@my.yorku.ca"), undefined);
    // Its fake id is accepted by the follow-up step and changes nothing.
    assert.deepEqual(await saveWaitlistDetails({ id: res.id, platform: "ios" }), { ok: true });
  });
});

describe("the follow-up questions", () => {
  test("save the phone, and still accept a school", async () => {
    const { id } = await joinWaitlist({ email: "priya@my.yorku.ca" });
    assert.deepEqual(await saveWaitlistDetails({ id, school: "  York   University ", platform: "android" }), { ok: true });
    const row = await find("priya@my.yorku.ca");
    assert.equal(row.school, rules.YORK);
    assert.equal(row.platform, "android");
  });

  test("keep earlier answers when a question is skipped", async () => {
    const { id } = await joinWaitlist({ email: "liam@my.yorku.ca" });
    await saveWaitlistDetails({ id, platform: "ios" });
    const row = await find("liam@my.yorku.ca");
    assert.equal(row.school, rules.YORK);
    assert.equal(row.platform, "ios");
  });

  test("reject a malformed id and ignore unknown platforms", async () => {
    const res = await saveWaitlistDetails({ id: "1 OR 1=1", platform: "ios" });
    assert.equal(res.ok, false);
    const { id } = await joinWaitlist({ email: "noah@my.yorku.ca" });
    await saveWaitlistDetails({ id, platform: "blackberry" });
    assert.equal((await find("noah@my.yorku.ca")).platform, null);
  });
});

describe("CSV export", () => {
  const request = (password) =>
    new Request("http://localhost/api/waitlist/export", password ? { headers: { authorization: `Basic ${Buffer.from(`admin:${password}`).toString("base64")}` } } : {});

  test("doesn't exist without a password configured", async () => {
    delete process.env.WAITLIST_EXPORT_PASSWORD;
    assert.equal((await exportRoute.GET(request("anything"))).status, 404);
  });

  test("asks for the password, and rejects a wrong one", async () => {
    process.env.WAITLIST_EXPORT_PASSWORD = "correct horse";
    const missing = await exportRoute.GET(request());
    assert.equal(missing.status, 401);
    assert.match(missing.headers.get("www-authenticate"), /^Basic /);
    assert.equal((await exportRoute.GET(request("wrong"))).status, 401);
  });

  test("returns every signup, with formulas defused", async () => {
    process.env.WAITLIST_EXPORT_PASSWORD = "correct horse";
    const { id } = await joinWaitlist({ email: "sam@my.yorku.ca" });
    await saveWaitlistDetails({ id, school: '=HYPERLINK("http://evil.example")' });

    const res = await exportRoute.GET(request("correct horse"));
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /^text\/csv/);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const lines = (await res.text()).trim().split("\r\n");
    assert.equal(lines[0], '"email","school","platform","source","signed_up_at","updated_at","confirmation_sent_at"');
    assert.equal(lines.length, (await listSignups()).length + 1);
    const sam = lines.find((l) => l.startsWith('"sam@my.yorku.ca"'));
    assert.ok(sam.includes(`"'=HYPERLINK(""http://evil.example"")"`), sam);
  });
});
