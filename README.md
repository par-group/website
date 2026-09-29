# Sidekick website

The public website for [Sidekick](https://github.com/parsasalama6t/sidekick), the friends-only app for university students, launching first at York University. Live at **[trysidekick.ca](https://www.trysidekick.ca)**.

**The website is not the product.** It has three jobs:

1. **Trust.** Explain what Sidekick is, who it's for and how it keeps students safe, with the Safety, Support, Privacy and Terms pages students, parents and York staff look for.
2. **The App Store.** Host the Support, Privacy Policy and Marketing URLs App Store Connect asks for, and point to the listing once it's live.
3. **The waitlist.** Collect signups, where people come from (`?ref=` links on posters and posts), and which schools and phones to plan for.

Everything else (sign-in, profiles, swiping, chat) lives in the app. The site only illustrates it, with mockups built from the app's own design tokens and components.

## Getting started

Requires Node 20.9+ (CI uses the version in `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:3000
```

No setup is needed locally: waitlist signups go to a SQLite file in `./data`. Copy `.env.example` to `.env.local` to try the CSV export or the `/app-demo` proxy.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run check` | Lint, typecheck and test (what CI runs, minus the build) |
| `npm run lint` · `npm run typecheck` · `npm test` | Each check on its own |

## Pages

| Path | What it's for |
| --- | --- |
| `/` | Home: waitlist signup, how the app works, safety, campuses, FAQ |
| `/safety` | Protections, community guidelines, meeting tips, reporting and crisis resources |
| `/support` | Waitlist and account help (App Store **Support URL**) |
| `/privacy` | Privacy Policy covering the website, waitlist and app (App Store **Privacy Policy URL**) |
| `/terms` | Terms of Use |
| `/api/waitlist/export` | Password-protected CSV of every signup |
| `/api/health` | Which settings are configured, and whether the database is reachable |
| `/app-demo/…` | The app, proxied from its own Vercel project when `APP_DEMO_ORIGIN` is set |

## Project structure

```
src/
  app/                 Pages, route handlers, share image, icons, sitemap, robots
  components/
    brand/             Logo and app icon (copied from the app)
    mockups/           Phone frame and static recreations of the app's screens
    site/              Header, footer, section headings, FAQ list, App Store badge
    ui/                Icons and tag pills (the app's, plus a few for the site)
    waitlist/          The signup form and its optional follow-up questions
  lib/                 Site config (site.ts) and waitlist input rules, safe for the browser
  server/              Server-only: database, waitlist queries, Server Actions
tests/                 Node test runner suites against a real temp SQLite database
docs/                  Deployment, the waitlist export and the /app-demo setup
```

## How the waitlist works

1. A visitor enters their email. `joinWaitlist` (`src/server/actions/waitlist.ts`) validates it on the server and stores it once, however many times it's submitted. The response is the same either way, so the form never reveals who is on the list.
2. Two optional questions follow: where they study (pre-filled for York email addresses) and which phone they use.
3. The confirmation offers a share link (`?ref=share`).

Spam protection is a hidden honeypot field: submissions that fill it get a normal-looking success and nothing is stored. The source label comes from `?ref=`, `utm_*` or the referring site, and is kept for the visit in `sessionStorage`.

Data lives in one table, `waitlist_signups`, in Turso in production (the app's database can be reused) and a local SQLite file in development. See [docs/deployment.md](docs/deployment.md).

## Conventions

These follow the app's, so both projects read the same:

- Design tokens in `src/app/globals.css` match the app's. Change them in both places.
- Anything touching the database or secrets lives in `src/server` and starts with `import "server-only"`.
- Every mutation is a Server Action in `src/server/actions` that re-validates its input.
- Components are PascalCase, other modules kebab-case, and imports use the `@/` alias (`src/`).
- Links to the app (`/app-demo`) are plain `<a>` tags, not `<Link>`, since it's a separate Next.js app.
- Launch-time stand-ins are marked `TODO(launch)`: `grep -rn "TODO(launch)" src`.
