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

### Mobile setup notes
- Production-only Clerk key (`clerk.tapestry.design`) blocks the dev preview domain. Dev work needs a Clerk dev instance key in `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- For deployed builds, set `EXPO_PUBLIC_API_URL` to the published API origin (otherwise it falls back to `EXPO_PUBLIC_DOMAIN` / `REPLIT_DEV_DOMAIN`).
