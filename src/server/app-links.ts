import "server-only";

// Universal links (iOS) and App Links (Android). Once the apps' details are set,
// a link like trysidekick.ca/invite/abc opens the app when it's installed, and
// this site's /invite page when it isn't. See docs/deployment.md, "6. App links".

/** The paths the app opens. Everything else on the domain stays in the browser. */
export const APP_LINK_PATHS = ["/invite/*"];

const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** APPLE_APP_IDS: "<Team ID>.<bundle ID>", e.g. ABCDE12345.ca.trysidekick.app. Invalid entries are ignored. */
export function appleAppIds(): string[] {
  return list(process.env.APPLE_APP_IDS).filter((id) => /^[A-Z0-9]{10}\.[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(id));
}

/** A SHA-256 fingerprint, with or without colons, in the form Android expects: upper case, colon-separated. */
function fingerprint(value: string): string | null {
  const hex = value.replace(/[\s:]/g, "").toUpperCase();
  return /^[0-9A-F]{64}$/.test(hex) ? hex.match(/../g)!.join(":") : null;
}

/** ANDROID_PACKAGE_NAME and ANDROID_CERT_SHA256, or null unless both are set and valid. */
export function androidApp(): { packageName: string; fingerprints: string[] } | null {
  const packageName = process.env.ANDROID_PACKAGE_NAME?.trim() ?? "";
  const fingerprints = [...new Set(list(process.env.ANDROID_CERT_SHA256).map(fingerprint))].filter((f): f is string => !!f);
  if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(packageName) || !fingerprints.length) return null;
  return { packageName, fingerprints };
}

/** /.well-known/apple-app-site-association, or null when no iOS app is set. */
export function appleAppSiteAssociation() {
  const appIDs = appleAppIds();
  if (!appIDs.length) return null;
  return { applinks: { details: [{ appIDs, components: APP_LINK_PATHS.map((path) => ({ "/": path })) }] } };
}

/** /.well-known/assetlinks.json, or null when no Android app is set. */
export function assetLinks() {
  const app = androidApp();
  if (!app) return null;
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: app.packageName, sha256_cert_fingerprints: app.fingerprints },
    },
  ];
}
