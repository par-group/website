/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { load, mock, useTempWorkspace } = require("./support/harness.cjs");

const workspace = useTempWorkspace("dashboard-actions");
after(() => workspace.cleanup());

// The request's Authorization header, as the dashboard actions read it.
let password = null;
mock("next/headers", {
  headers: async () => new Headers(password === null ? {} : { authorization: `Basic ${Buffer.from(`me:${password}`).toString("base64")}` }),
});
// The SMTP server's answer to a login.
let loginError = null;
mock("nodemailer", {
  createTransport: () => ({
    verify: async () => {
      if (loginError) throw new Error(loginError);
      return true;
    },
  }),
});

const { removeSignup, testEmailConnection } = load("@/server/actions/dashboard");
const { addSignup, listSignups } = load("@/server/waitlist");

const notFound = (e) => String(e.digest ?? "").includes("404");

beforeEach(() => {
  process.env.DASHBOARD_PASSWORD = "correct horse";
  password = "correct horse";
  loginError = null;
  Object.assign(process.env, { SMTP_HOST: "smtppro.zoho.com", SMTP_USER: "hello@trysidekick.ca", SMTP_PASS: "app-password" });
});

describe("the dashboard's actions", () => {
  test("refuse without the dashboard password", async () => {
    password = "wrong";
    await assert.rejects(removeSignup("anything"), notFound);
    await assert.rejects(testEmailConnection(), notFound);
    password = null;
    await assert.rejects(removeSignup("anything"), notFound);
    delete process.env.DASHBOARD_PASSWORD;
    password = "correct horse";
    await assert.rejects(testEmailConnection(), notFound);
  });

  test("remove exactly the chosen signup", async () => {
    const { id } = await addSignup("test@my.yorku.ca", null);
    await addSignup("keep@my.yorku.ca", null);
    assert.deepEqual(await removeSignup(id), { ok: true, detail: "Removed." });
    assert.deepEqual(
      (await listSignups()).map((s) => s.email),
      ["keep@my.yorku.ca"],
    );
    assert.deepEqual(await removeSignup(id), { ok: false, detail: "Already removed." });
    assert.deepEqual(await removeSignup(42), { ok: false, detail: "Missing signup." });
  });

  test("test the email login and report the provider's answer", async () => {
    assert.deepEqual(await testEmailConnection(), { ok: true, detail: "smtppro.zoho.com accepted the login for hello@trysidekick.ca." });
    loginError = "Invalid login: 535 Authentication Failed";
    assert.deepEqual(await testEmailConnection(), { ok: false, detail: "Invalid login: 535 Authentication Failed" });
    for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]) delete process.env[key];
    assert.deepEqual(await testEmailConnection(), { ok: false, detail: "No email provider is configured." });
  });
});
