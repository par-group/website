/* eslint-disable @typescript-eslint/no-require-imports */
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./support/harness.cjs");

const apple = load("@/app/.well-known/apple-app-site-association/route");
const android = load("@/app/.well-known/assetlinks.json/route");

const FINGERPRINT = "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5";

beforeEach(() => {
  delete process.env.APPLE_APP_IDS;
  delete process.env.ANDROID_PACKAGE_NAME;
  delete process.env.ANDROID_CERT_SHA256;
});

describe("iOS universal links", () => {
  test("don't exist until the app is set", () => {
    assert.equal(apple.GET().status, 404);
    process.env.APPLE_APP_IDS = "ca.trysidekick.app"; // missing the Team ID
    assert.equal(apple.GET().status, 404);
  });

  test("send /invite/ links to the app, and nothing else", async () => {
    process.env.APPLE_APP_IDS = "ABCDE12345.ca.trysidekick.app, not-an-app-id";
    const res = apple.GET();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /^application\/json/);
    assert.deepEqual(await res.json(), {
      applinks: { details: [{ appIDs: ["ABCDE12345.ca.trysidekick.app"], components: [{ "/": "/invite/*" }] }] },
    });
  });
});

describe("Android App Links", () => {
  test("need both the package and a signing fingerprint", () => {
    assert.equal(android.GET().status, 404);
    process.env.ANDROID_PACKAGE_NAME = "ca.trysidekick.app";
    assert.equal(android.GET().status, 404);
    process.env.ANDROID_CERT_SHA256 = "not a fingerprint";
    assert.equal(android.GET().status, 404);
    process.env.ANDROID_PACKAGE_NAME = "sidekick";
    process.env.ANDROID_CERT_SHA256 = FINGERPRINT;
    assert.equal(android.GET().status, 404);
  });

  test("accept fingerprints with or without colons, in any case", async () => {
    process.env.ANDROID_PACKAGE_NAME = "ca.trysidekick.app";
    process.env.ANDROID_CERT_SHA256 = `${FINGERPRINT.replaceAll(":", "").toLowerCase()}, ${FINGERPRINT}`;
    const res = android.GET();
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /^application\/json/);
    assert.deepEqual(await res.json(), [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: "ca.trysidekick.app", sha256_cert_fingerprints: [FINGERPRINT] },
      },
    ]);
  });
});
