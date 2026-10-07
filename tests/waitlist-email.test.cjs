/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@libsql/client");
const { load, mock, useTempWorkspace } = require("./support/harness.cjs");

const workspace = useTempWorkspace("waitlist-email");
after(() => workspace.cleanup());

// Email goes to a stand-in for the SMTP server, and work scheduled with after()
// is collected so each test can run it, as Next.js would once the response is sent.
const sent = [];
let failSending = false;
mock("nodemailer", {
  createTransport: () => ({
    sendMail: async (message) => {
      if (failSending) throw new Error("connection refused");
      sent.push(message);
      return { accepted: [message.to] };
    },
  }),
});
const scheduled = [];
mock("next/server", { after: (task) => scheduled.push(task) });
const runScheduled = async () => {
  while (scheduled.length) await scheduled.shift()();
};

const SMTP = { SMTP_HOST: "smtp.test", SMTP_USER: "hello@trysidekick.ca", SMTP_PASS: "secret" };
const withEmail = () => Object.assign(process.env, SMTP);
const withoutEmail = () => Object.keys(SMTP).forEach((k) => delete process.env[k]);

let actions, waitlist, db, emailModule;

before(async () => {
  // A database from before this change: no removal or confirmation columns, one signup.
  fs.mkdirSync(path.join(workspace.dir, "data"));
  const old = createClient({ url: `file:${path.join(workspace.dir, "data", "waitlist.db")}` });
  await old.execute(
    "CREATE TABLE waitlist_signups (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, school TEXT, platform TEXT, source TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  );
  await old.execute("INSERT INTO waitlist_signups VALUES ('old', 'early@my.yorku.ca', 'York University', 'ios', NULL, 1, 1)");
  old.close();

  db = load("@/server/db");
  actions = load("@/server/actions/waitlist");
  waitlist = load("@/server/waitlist");
  emailModule = load("@/server/waitlist-email");
});

beforeEach(() => {
  sent.length = 0;
  scheduled.length = 0;
  failSending = false;
  withEmail();
});

const removeUrlIn = (message) => message.text.match(/https:\/\/\S+\/waitlist\/remove\/([A-Za-z0-9_-]+)/);
const row = async (email) => (await (await db.db()).execute({ sql: "SELECT * FROM waitlist_signups WHERE email = ?", args: [email] })).rows[0];

describe("an existing database", () => {
  test("gains the new columns, keeping everyone on it", async () => {
    const columns = (await (await db.db()).execute("PRAGMA table_info(waitlist_signups)")).rows.map((c) => c.name);
    assert.ok(columns.includes("removal_token_hash") && columns.includes("confirmation_sent_at"));
    const early = await row("early@my.yorku.ca");
    assert.equal(early.platform, "ios");
    assert.equal(early.confirmation_sent_at, null);
  });
});

describe("the confirmation email", () => {
  test("goes to a new signup once the response is sent, with a link to remove the address", async () => {
    const res = await actions.joinWaitlist({ email: "Maya@My.YorkU.ca" });
    assert.equal(res.ok, true);
    assert.equal(sent.length, 0, "nothing is sent before the response");
    assert.equal(scheduled.length, 1);
    await runScheduled();

    assert.equal(sent.length, 1);
    const [message] = sent;
    assert.equal(message.to, "maya@my.yorku.ca");
    assert.equal(message.from, "Sidekick <hello@trysidekick.ca>");
    assert.match(message.subject, /You’re on the Sidekick waitlist/);
    assert.match(message.text, /thrilled you joined/);
    assert.match(message.text, /Stay tuned/);
    const link = removeUrlIn(message);
    assert.ok(link, message.text);
    assert.equal(link[0], `https://www.trysidekick.ca/waitlist/remove/${link[1]}`);
    assert.ok(message.html.includes(`href="${link[0]}"`), "the HTML version has the same link");
    assert.equal(message.headers["List-Unsubscribe"], `<${link[0]}>`);
    assert.equal(message.headers["X-Entity-Ref-ID"], `waitlist-confirmation-${res.id}`);
    assert.equal(typeof (await row("maya@my.yorku.ca")).confirmation_sent_at, "number");
  });

  test("isn't sent again when the same address joins again", async () => {
    await actions.joinWaitlist({ email: "jordan@my.yorku.ca" });
    await actions.joinWaitlist({ email: "JORDAN@my.yorku.ca" });
    await runScheduled();
    assert.equal(sent.length, 1);
  });

  test("isn't sent for refused addresses, bots, or when email isn't set up", async () => {
    await actions.joinWaitlist({ email: "sam@gmail.com" });
    await actions.joinWaitlist({ email: "bot@my.yorku.ca", website: "spam" });
    withoutEmail();
    await actions.joinWaitlist({ email: "quiet@my.yorku.ca" });
    assert.equal(scheduled.length, 0);
    assert.ok(await row("quiet@my.yorku.ca"), "the signup itself still works");
  });

  test("a failed send is logged, never shown, and not recorded as sent", async (t) => {
    const errors = t.mock.method(console, "error", () => {});
    failSending = true;
    const res = await actions.joinWaitlist({ email: "unlucky@my.yorku.ca" });
    assert.equal(res.ok, true);
    await runScheduled();
    assert.equal(errors.mock.callCount(), 1);
    assert.equal((await row("unlucky@my.yorku.ca")).confirmation_sent_at, null);
  });

  test("escapes the link in the HTML version", () => {
    const { html } = emailModule.confirmationEmail('https://example.com/?a=1&b="2"');
    assert.ok(html.includes('href="https://example.com/?a=1&#38;b=&#34;2&#34;"'));
  });
});

describe("removing an address with the email's link", () => {
  const redirectTo = async (promise) => {
    try {
      await promise;
    } catch (e) {
      if (String(e.digest ?? "").startsWith("NEXT_REDIRECT")) return e.digest.split(";")[2];
      throw e;
    }
    assert.fail("expected a redirect");
  };
  const form = (token) => {
    const data = new FormData();
    data.set("token", token);
    return data;
  };

  test("finds the signup, removes it once, and the link then stops working", async () => {
    await actions.joinWaitlist({ email: "notme@my.yorku.ca" });
    await runScheduled();
    const token = removeUrlIn(sent[0])[1];

    assert.deepEqual(await waitlist.findSignupByRemovalToken(token), { id: (await row("notme@my.yorku.ca")).id, email: "notme@my.yorku.ca" });
    assert.equal(await redirectTo(actions.removeFromWaitlist(form(token))), "/waitlist/removed");
    assert.equal(await row("notme@my.yorku.ca"), undefined);
    assert.equal(await waitlist.findSignupByRemovalToken(token), null);
    assert.equal(await redirectTo(actions.removeFromWaitlist(form(token))), "/waitlist/removed", "using it twice is harmless");
  });

  test("ignores links that aren't real, and never touches anyone else", async () => {
    const before = (await waitlist.listSignups()).length;
    for (const token of ["", "short", "x".repeat(32), "' OR 1=1 --".padEnd(32, "x"), null]) {
      assert.equal(await waitlist.findSignupByRemovalToken(String(token)), null);
      await redirectTo(actions.removeFromWaitlist(form(token)));
    }
    assert.equal((await waitlist.listSignups()).length, before);
  });

  test("lets someone join again after removing themselves", async () => {
    await actions.joinWaitlist({ email: "again@my.yorku.ca" });
    await runScheduled();
    await redirectTo(actions.removeFromWaitlist(form(removeUrlIn(sent[0])[1])));
    const res = await actions.joinWaitlist({ email: "again@my.yorku.ca" });
    await runScheduled();
    assert.equal(res.ok, true);
    assert.equal(sent.length, 2, "a new signup gets a new confirmation");
    assert.notEqual(removeUrlIn(sent[1])[1], removeUrlIn(sent[0])[1]);
  });
});
