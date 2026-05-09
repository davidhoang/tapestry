# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Express API at `/api`. Mobile endpoints under `/api/mobile/*` (Bearer-auth, see `src/mobile-routes.ts`).
- `artifacts/tapestry` — Web app (React + Vite) at `/`. Brand: warm gold `#C8944B`, Crimson Text serif, ivory surfaces.
- `artifacts/tapestry-mobile` — Expo mobile companion at `/tapestry-mobile/`. Uses Clerk Expo SDK with SecureStore token cache; calls `/api/mobile/*` with Bearer token from `getToken()`. Shares brand tokens (gold, serif, ivory) with the web app via `constants/colors.ts` and `constants/typography.ts`. Dev script mirrors `VITE_CLERK_PUBLISHABLE_KEY` → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- `artifacts/mockup-sandbox` — Component preview sandbox.

## Production schema

Schema changes in `lib/db/src/schema/schema.ts` are applied to the **development** database via `pnpm --filter @workspace/db run push` (run automatically by the post-merge setup script). They are applied to the **production** database only when the user clicks **Publish** — Replit diffs dev vs prod and applies the resulting SQL as part of the publish.

When adding/altering columns, after the change is merged you must tell the user to re-publish, otherwise production code that reads the new columns will throw "column does not exist" errors (this is exactly what caused the MCP `/mcp` 500s when `api_tokens.usage_count` shipped without a re-publish). Do **not** run `drizzle-kit push`, `psql`, or any custom migration script against production, and do **not** add startup-time DDL or deploy-build hooks to "self-heal" prod.

### Web/API/Mobile auth keys (Clerk)

Clerk keys are stored as **global Replit Secrets**, but the dev scripts use a `CLERK_DEV_*` fallback pattern so the Replit preview, the published web app, and the mobile app all see the right key without manual swapping at publish time.

Required global Secrets:

| Secret | Value | Used by |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_…` | Default key for web + mobile (used by dev preview) |
| `CLERK_SECRET_KEY` | `sk_test_…` | Default key for API server (used by dev preview) |
| `CLERK_DEV_PUBLISHABLE_KEY` | `pk_test_…` | Explicit dev preview override (web, API, Expo) |
| `CLERK_DEV_SECRET_KEY` | `sk_test_…` | Explicit dev preview override (API server) |
| `CLERK_LIVE_PUBLISHABLE_KEY` | `pk_live_…` | Production override (web build + API server runtime) |
| `CLERK_LIVE_SECRET_KEY` | `sk_live_…` | Production override (API server runtime) |

How the fallback works:

- **Production**: the API server's `app.ts` runs an early `process.env` swap when `NODE_ENV === "production"`: if `CLERK_LIVE_*` is set, it overwrites `VITE_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` before `@clerk/express` initializes. The web build script (`artifacts/tapestry/package.json` → `build`) also prefers `CLERK_LIVE_PUBLISHABLE_KEY` so the bundle inlines the live key.
- **Dev preview**: each artifact's `dev` script wipes `CLERK_LIVE_*` (`CLERK_LIVE_PUBLISHABLE_KEY=` prefix) and exports `${CLERK_DEV_*:-$VITE_CLERK_PUBLISHABLE_KEY}`, so dev always uses test keys regardless of what's in workspace secrets.
- The Expo dev script also maps `CLERK_DEV_PUBLISHABLE_KEY` → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`. For published Expo builds, set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…` separately.

You can verify what's actually being used at runtime by hitting `/api/healthz/diagnostics` (no auth required). It returns `clerk.publishableKeyKind` / `secretKeyKind` (`"live"` or `"test"`) and `liveOverrideAvailable`.

Why this pattern (not per-environment Secrets): Replit's per-environment env-var mechanism stores values in `.replit`, which is committed to git — putting `CLERK_SECRET_KEY` there would leak it. Per-environment encrypted Secrets aren't available in this workspace's UI yet, so the `CLERK_DEV_*` override is the safest equivalent.

Using the `pk_test_…` key in development is what avoids the "Production Keys are only allowed for domain 'tapestry.design'" error in the Replit preview. If you ever need to add another Clerk-related secret (e.g. a webhook signing secret), follow the same naming pattern: store the live value under its real name and the dev value under a `CLERK_DEV_*` alias, then mirror it in the dev script with `${CLERK_DEV_FOO:-$FOO}`.

### Mobile setup notes
- For deployed builds, set `EXPO_PUBLIC_API_URL` to the published API origin (otherwise it falls back to `EXPO_PUBLIC_DOMAIN` / `REPLIT_DEV_DOMAIN`).
