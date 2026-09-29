# Deployment

The website runs on **Vercel**, like the app. It owns the domain root, **trysidekick.ca**, and serves the app (the `app-demo` project from the [Sidekick repository](https://github.com/parsasalama6t/sidekick)) at `/app-demo` on the same domain.

`GET /api/health` reports which settings are present (never their values) and whether the waitlist database is reachable. Check it after every configuration change.

## 1. Create the Vercel project

Import this repository into Vercel. Everything stays on the defaults: framework preset Next.js, the repository root as Root Directory, the default build command.

## 2. Waitlist database: Turso

The waitlist needs `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Either:

- **reuse the app's database**: copy the two values from the app-demo project's environment variables. The website only creates and uses its own table, `waitlist_signups`, and never touches the app's tables; or
- **create a separate database** under **Storage → Create → Turso**, if you'd rather keep the waitlist apart.

The table is created automatically on the first signup or health check.

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
2. In **this** project, add both, with `www.trysidekick.ca` as the primary domain and the apex redirecting to it.

DNS records don't change, since both projects are on Vercel. Check `https://www.trysidekick.ca/api/health` and `https://www.trysidekick.ca/app-demo/api/health` afterwards.

## Launch day

- Set `APP_STORE_ID` in `src/lib/site.ts` to the listing's numeric ID. The "Coming soon" badges turn into links, and iPhone visitors see Safari's Smart App Banner.
- Replace `AppStoreBadge` with Apple's official "Download on the App Store" badge from Apple's marketing resources, as Apple's guidelines require.
- In App Store Connect, use `https://www.trysidekick.ca/support` as the Support URL, `https://www.trysidekick.ca/privacy` as the Privacy Policy URL and `https://www.trysidekick.ca` as the Marketing URL.
- Update `LEGAL_LAST_UPDATED` in `src/lib/site.ts` whenever the Privacy Policy or Terms change.

Code stand-ins to revisit are marked `TODO(launch)`: `grep -rn "TODO(launch)" src`.

## Redeploying

Environment variables only apply to new deployments. After changing them, go to **Deployments → ⋯ → Redeploy**. CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a production build on every push and pull request to `main`.
