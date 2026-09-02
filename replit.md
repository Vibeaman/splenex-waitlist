# Splenex Waitlist

A task-gated waitlist for Splenex that collects early-access requests after visitors join the project's X and Telegram communities.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/splenex-waitlist/src/pages/home.tsx` — public task-gated signup flow
- `artifacts/splenex-waitlist/src/pages/admin.tsx` — internal submissions view
- `artifacts/splenex-waitlist/src/index.css` — Splenex visual tokens and motion
- `lib/api-spec/openapi.yaml` — source of truth for waitlist API contracts
- `lib/db/src/schema/waitlist.ts` — source of truth for persisted entries

## Architecture decisions

- External task completion is modeled as an explicit user confirmation after opening each destination, leaving a clean seam for later platform verification.
- Email and X username are unique at the database layer; usernames are normalized before persistence.
- The admin route intentionally uses the same generated client hooks as the public form so it reflects live server data.

## Product

- The public `/` route guides visitors through the two required social tasks before unlocking the X username and email form.
- The `/admin` route shows aggregate metrics, searchable submissions, empty/loading/error states, and CSV export.
- The API stores normalized waitlist entries with X and Telegram completion flags and exposes list, create, and summary endpoints.

## User preferences

- Keep the visual language close to the supplied references: almost-black surfaces, signal yellow, white type, thin borders, and restrained motion.
- The experience should feel natural and intentional rather than "vibecoded"; Supabase integration/auth can be added later.

## Gotchas

- The current social-task gate is user-confirmed after opening each destination; platform/API verification is intentionally left for the Supabase follow-up.
- The generated Zod client in this workspace is pinned to Zod 3, so OpenAPI integer/email formats can emit unsupported Zod 4 helpers; waitlist IDs/counts use number and emails use a regex pattern.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
