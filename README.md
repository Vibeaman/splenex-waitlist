# Splenex Waitlist

A task-gated waitlist for Splenex that collects early-access requests after visitors join the project's X and Telegram communities. Public signup at `/`, internal submissions view at `/admin`.

## Stack

- pnpm workspaces, Node.js 22+, TypeScript 5.9
- Frontend: Vite + React 19, Tailwind CSS 4, TanStack Query, wouter
- API: Express 5, PostgreSQL + Drizzle ORM, Zod validation
- API codegen: Orval (from OpenAPI spec); build: esbuild (CJS-bundled from source)

## Where things live

- `artifacts/splenex-waitlist/` — public task-gated signup flow (`src/pages/home.tsx`), admin view (`src/pages/admin.tsx`), visual tokens (`src/index.css`)
- `artifacts/api-server/` — Express server (`src/app.ts`), waitlist routes (`src/routes/waitlist.ts`)
- `lib/api-spec/openapi.yaml` — source of truth for the waitlist API contract
- `lib/db/src/schema/waitlist.ts` — source of truth for persisted entries
- `lib/api-client-react/` — generated React Query client (same origin, base path `/api`)
- `lib/api-zod/` — generated Zod schemas shared by client and server
- `scripts/vercel-build.mjs` — assembles the Vercel Build Output API directory

## Local development

Requirements: Node.js 22+ (prefer 24, pnpm 9+., A Postgres connection string in `DATABASE_URL`.

```bash
pnpm install
# terminal 1 — API server (defaults to port 3000)
DATABASE_URL=postgres://... pnpm --filter @workspace/api-server run dev
# terminal 2 — web app
pnpm --filter @workspace/splenex-waitlist run dev
```

The web app proxies nothing—it calls the same-origin `/api/*` endpoints (the API server must run on the same port for full-stack local dev; set `PORT=3000` for the web dev server too. For DB schema changes: `DATABASE_URL=... pnpm --filter @workspace/db run push`.

## Deploying to Vercel

The repo ships a Vercel Build Output API setup (see `vercel.json` and `scripts/vercel-build.mjs`):

- Build command: `pnpm run vercel:build` — builds the API server bundle and the Vite app, then assembles `.vercel/output/`
- The Express app becomes a single Node.js serverless function at `/api` (`functions/api.func`); static frontend files are served from the CDN, with an SPA fallback to `/index.html`
- Routing is declared in `.vercel/output/config.json` (API → function, filesystem, SPA rewrite)

### Steps

1. Push this repo to GitHub.
2. In Vercel: **Add New Project** → import the repo. Set **Framework Preset** to *Other* (the `vercel.json` provides the build command; no dashboard overrides needed).
3. Add environment variables (**Settings → Environment Variables**):
   - `DATABASE_URL` — Postgres connection string. Use a **pooled/connection-pooler** URL (e.g. Neon, Supabase pgbouncer-compatible pooler) so each serverless instance reuses connections safely.
   - `PORT` (optional) — the API defaults to `3000` when unset; only needed locally.
   - `BASE_PATH` (optional) — set if serving under a sub-path; defaults to `/`.
4. Deploy. Verify:
   - `GET /api/healthz` → `{ "status": "ok" }`
   - `/` loads the signup page; `/admin` deep-links properly (SPA fallback).

### Notes/limitations

- The waitlist routes require the DB — without `DATABASE_URL` the function fails to boot (by design, a clear error is thrown at import time).
- Node runtime is pinned to `nodejs24.x` in `.vercel/output/functions/api.func/.vc-config.json` (matches the `engines` field; adjust if your Vercel plan doesn't offer 24 yet).
- The generated waitlist client uses same-origin `/api/*` paths so no CORS config is required in production.
- `scripts/post-merge.sh` (a Replit deploy hook) was removed; push schema with `pnpm --filter @workspace/db run push` manually or via CI instead.

## Architecture decisions

- External task completion is modeled as an explicit user confirmation after opening each destination, leaving a clean seam for later platform verification。
- Email and X username are unique at the database layer; usernames are normalized before persistence.
 
## Gotchas

- The generated Zod client in this workspace is pinned to Zod 3, so OpenAPI integer/email formats can emit unsupported Zod 4 helpers; waitlist IDs/counts use number and emails use a regex pattern。