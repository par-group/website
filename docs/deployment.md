# Deployment

The website runs on **Vercel**, like the app. It owns the domain root, **trysidekick.ca**, and serves the app (the `app-demo` project from the [Sidekick repository](https://github.com/parsasalama6t/sidekick)) at `/app-demo` on the same domain.

`GET /api/health` reports which settings are present (never their values) and whether the waitlist database is reachable. Check it after every configuration change.

## 1. Create the Vercel project

Import this repository into Vercel. Everything stays on the defaults: framework preset Next.js, the repository root as Root Directory, the default build command.

## 2. Waitlist database: Turso

The waitlist needs `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, which Vercel sets when a Turso database is connected to the project (**Storage → Create → Turso**, or **Connect Database** for an existing one). The table is created automatically on the first signup or health check.

**One database for the website and the app.** The waitlist's database is named `waitlist`, and the app uses it too from launch: in the app's Vercel project, **Storage → Connect Database → `waitlist`**. The website only creates and uses its own table, `waitlist_signups`, and the app creates its own tables on its first request, so they don't collide. Sharing it means the dashboard sees the app's data with no extra setup, and the launch email list and the app's accounts live side by side.

## 3. Waitlist export

Set `WAITLIST_EXPORT_PASSWORD` to a long random value (e.g. `openssl rand -base64 24`). Then open `https://www.trysidekick.ca/api/waitlist/export` in a browser, enter the password (any username), and a CSV with every signup downloads:

| Column | Meaning |
| --- | --- |
| `email` | Lower-cased and trimmed, one row per address |
| `school` | `York University`, another school the person typed, or empty. York email addresses fill this in automatically |
| `platform` | `ios`, `android` or empty |
| `source` | How they found the site: the `?ref=` of the link they used, their `utm_*` parameters, or the site that sent them |
| `signed_up_at`, `updated_at` | UTC timestamps |

Import the CSV into the tool that sends the launch email (e.g. Resend, Mailchimp, Loops) and use its unsubscribe link in every email. If you use a new tool, add it to the service providers in the Privacy Policy (`src/app/privacy/page.tsx`).

Without the variable, the route returns 404. You can also query the table directly with the Turso CLI: `turso db shell <database> "SELECT * FROM waitlist_signups"`.

### Tracking where signups come from

Put `?ref=` on every link you share, and each signup records it:

- a poster's QR code: `trysidekick.ca/?ref=poster-vari-hall`
- an Instagram bio: `trysidekick.ca/?ref=instagram-bio`
- a club's newsletter: `trysidekick.ca/?ref=club-newsletter`

Keep refs short: letters, numbers, `-`, `_`, `.`, `/` and `:` are kept, up to 120 characters. The "Share the waitlist" button after signing up uses `?ref=share`.

## 4. Serve the app at /app-demo

The app's `basePath` is `/app-demo`, so both projects can share the domain ([Next.js multi-zones](https://nextjs.org/docs/app/guides/multi-zones)): this site answers every request and forwards `/app-demo/…` to the app's own deployment.

1. **In the app-demo Vercel project**, note its production URL under **Settings → Domains** (e.g. `sidekick-app-demo.vercel.app`).
2. **In the app's code**, allow its Server Actions (sign-in, profile, swipes) to be posted from the shared domain. In `app-demo/next.config.ts`:

   ```ts
   experimental: {
     serverActions: { allowedOrigins: ["www.trysidekick.ca", "trysidekick.ca"] },
   },
   ```

   Without it, pages load through the website but every form in the app fails.
3. **In this project**, set `APP_DEMO_ORIGIN` to the app's URL from step 1, with `https://` and no trailing slash, and redeploy. `/app-demo` now serves the app, and old app links like `/login` or `/discover` redirect to `/app-demo/login` and `/app-demo/discover`.
4. **Move the domain** (next section).

## 5. Domain

`trysidekick.ca` points at Vercel already (see the app's `docs/deployment.md` for the DNS records). To switch the root over to the website:

1. In the **app-demo** project, **Settings → Domains**, remove `trysidekick.ca` and `www.trysidekick.ca`.
2. In **this** project, add both. Make `www.trysidekick.ca` the primary domain, and connect `trysidekick.ca` to **Production** as well, **not** as a redirect to www. The site redirects the apex to www itself (`next.config.ts`), except for `/.well-known/`, which invite links need on both hosts ([App links](#6-app-links)). If the apex is already a redirect, open **Edit** on it and switch it to **Connect to an environment → Production**.

DNS records don't change, since both projects are on Vercel. Check `https://www.trysidekick.ca/api/health` and `https://www.trysidekick.ca/app-demo/api/health` afterwards.

## 6. App links

Invite links like `https://trysidekick.ca/invite/abc` open the app when it's installed (iOS universal links and Android App Links), and this site's `/invite/…` page when it isn't. That page introduces Sidekick and offers the waitlist, or the App Store once the app is listed. Only `/invite/…` opens the app: the rest of the site always stays in the browser.

### On the website

Set these in Vercel and redeploy. `/api/health` shows `iosAppLinks` and `androidAppLinks` as `true` once they're valid.

| Variable | What it is | Where to find it |
| --- | --- | --- |
| `APPLE_APP_IDS` | `<Team ID>.<bundle ID>`, e.g. `ABCDE12345.ca.trysidekick.app` | Team ID: developer.apple.com → Account → Membership details. Bundle ID: the app's Xcode target |
| `ANDROID_PACKAGE_NAME` | The app's `applicationId`, e.g. `ca.trysidekick.app` | The app's `build.gradle` |
| `ANDROID_CERT_SHA256` | SHA-256 fingerprint of the certificate that signs the installed app | Play Console → App integrity → App signing → **App signing key certificate**. To test builds installed outside Play, add the upload or debug key's fingerprint too, comma-separated |

Until they're set, `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` return 404 and invite links just open the website.

Apple and Google fetch both files from each host a link can use, and give up on a redirect. That's why the apex can't be a Vercel redirect (step 5). After deploying, each of these should print `HTTP/2 200` and `content-type: application/json`, and no `location:` line:

```bash
curl -sI https://trysidekick.ca/.well-known/apple-app-site-association
curl -sI https://www.trysidekick.ca/.well-known/apple-app-site-association
curl -sI https://trysidekick.ca/.well-known/assetlinks.json
curl -sI https://www.trysidekick.ca/.well-known/assetlinks.json
```

### In the app

- **iOS**: add the **Associated Domains** capability with `applinks:trysidekick.ca` and `applinks:www.trysidekick.ca`, and open the invite from the incoming URL (`onOpenURL` in SwiftUI). While developing, `applinks:trysidekick.ca?mode=developer` reads the file straight from the site instead of Apple's cache (turn on **Associated Domains Development** in the iPhone's Developer settings).
- **Android**: add this to the main activity in `AndroidManifest.xml`, and open the invite from the intent's URL:

  ```xml
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" />
    <data android:host="trysidekick.ca" />
    <data android:host="www.trysidekick.ca" />
    <data android:pathPrefix="/invite/" />
  </intent-filter>
  ```

- Share invites as `https://trysidekick.ca/invite/<code>`. If the friend installs the app first, opening the link again takes them to the invite.

### Checking it works

- **iOS**: Apple's cache can take up to a day to pick up changes. See what it has at `https://app-site-association.cdn-apple.com/a/v1/trysidekick.ca`. Test by tapping a link in Notes or Messages: typing it into Safari, or tapping it on a trysidekick.ca page, opens the website by design.
- **Android**: `adb shell pm get-app-links ca.trysidekick.app` should say `verified` for both hosts. Google's view: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://trysidekick.ca&relation=delegate_permission/common.handle_all_urls`.

## 7. Metrics dashboard

`/dashboard` is the owner's view of everything the site and app record, in three tabs:

- **Overview**: the numbers to check every week: waitlist → accounts, onboarding completion, time to first connection, D1/D7/D30 retention, reply rate and chats reaching 10+ messages. Each tile shows the last full week (Monday to Sunday, Toronto time) against the week before, and a table below has eight weeks of every number. Only real students count: the app's sample profiles and demo account are left out.
- **Waitlist**: everyone who joined. Totals, signups per day (30 or 90 days), where people came from, where they study and which phone they use, then the full list: search by email, school or source, filter by source, school and phone, and download everyone, or just the filtered list, as a CSV. Each breakdown links to the people behind it. Once the app has data, the list shows who has an account.
- **Setup**: whether each part is connected and working (the databases, app links, the App Store listing, and so on), what to do about anything that isn't, and which commit is running.

1. Set `DASHBOARD_PASSWORD` to a long random value. Open `https://www.trysidekick.ca/dashboard` and enter it (any username). Without the variable, the page doesn't exist.
2. The app's data: the dashboard reads the waitlist's database, which the app shares from launch (step 2), so there's nothing to set. Until the app has run on it, the dashboard says **No app data yet** and shows the waitlist numbers; the app's tiles fill in by themselves after launch.
   - Optional: set `APP_DATABASE_URL` to the database's URL and `APP_DATABASE_AUTH_TOKEN` to a **read-only** token for it (`turso db tokens create <database> --read-only`, or the Turso dashboard), so the dashboard can only ever read. Use these too if the app ever runs on a different database.
3. Redeploy, and check `/api/health`: `appDatabase` says `ok: true` once the app's tables are there, and `no app tables yet` before that.

### What it can't measure yet

Some numbers need data the app doesn't record. The tiles say so instead of guessing:

| Metric | Today | What would make it exact |
| --- | --- | --- |
| Waitlist → install rate | Waitlist emails that have an app account | After launch, installs are in App Store Connect’s App Analytics |
| Invites sent per user, invite → active | Not tracked. The dashboard shows waitlist signups from invite links | The app recording each invite: who sent it, and who joined from it |
| Reports per 1,000 users | Not tracked: reports arrive by email | In-app reporting ([launch checklist](https://github.com/parsasalama6t/sidekick/blob/main/app-demo/docs/launch-checklist.md)) |
| D1 / D7 / D30 retention | Counts a day if someone swiped, commented, replied or messaged | The app recording each day someone opens it |

## Launch day

- Set `APP_STORE_ID` in `src/lib/site.ts` to the listing's numeric ID. The "Coming soon" badges turn into links, and iPhone visitors see Safari's Smart App Banner. The invite page switches from the waitlist to the App Store.
- Make sure `/api/health` shows `iosAppLinks: true` (and `androidAppLinks` once there's an Android app), so invites open the app from day one.
- Replace `AppStoreBadge` with Apple's official "Download on the App Store" badge from Apple's marketing resources, as Apple's guidelines require.
- In App Store Connect, use `https://www.trysidekick.ca/support` as the Support URL, `https://www.trysidekick.ca/privacy` as the Privacy Policy URL and `https://www.trysidekick.ca` as the Marketing URL.
- Update `LEGAL_LAST_UPDATED` in `src/lib/site.ts` whenever the Privacy Policy or Terms change.

Code stand-ins to revisit are marked `TODO(launch)`: `grep -rn "TODO(launch)" src`.

## Redeploying

Environment variables only apply to new deployments. After changing them, go to **Deployments → ⋯ → Redeploy**. CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a production build on every push and pull request to `main`.
