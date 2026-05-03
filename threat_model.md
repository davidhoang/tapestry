# Threat Model

## Project Overview

Tapestry is a TypeScript pnpm-workspace application for managing designer/talent profiles, lists, portfolios, workspace collaboration, recommendations, and AI-assisted enrichment. The production surface consists of an Express 5 API (`artifacts/api-server`) backed by PostgreSQL/Drizzle (`lib/db`), a React/Vite web app (`artifacts/tapestry`), and an Expo mobile companion (`artifacts/tapestry-mobile`). Authentication is handled by Clerk for browser sessions and mobile Bearer tokens; API tokens beginning with `tap_` authenticate CLI/MCP automation.

The mockup sandbox and `.migration-backup` are development/reference areas and are out of production scope unless a production entry point imports them. In production, `NODE_ENV` is expected to be `production`, and platform TLS protects client/server transport.

## Assets

- **Workspace data** -- designers, lists, notes, jobs, recommendation feedback, saved searches, capture entries, and portfolio configuration. Unauthorized access can expose business-sensitive recruiting/talent data and private notes.
- **User accounts and sessions** -- Clerk identities, browser cookies, mobile Bearer tokens, and local user records. Compromise allows account impersonation and workspace access.
- **API tokens** -- `tap_` CLI/MCP tokens stored as SHA-256 hashes. A leaked token grants the token role's workspace permissions until expiration or revocation.
- **PII and contact data** -- designer emails, phone numbers, locations, portfolio inquiries, imported LinkedIn/PDF data, and enrichment results.
- **Uploaded and generated files** -- profile photos, capture images, and Object Storage-backed assets. Upload processing must prevent resource exhaustion and cross-workspace leakage.
- **Application secrets and integrations** -- PostgreSQL connection strings, Clerk keys, OpenAI keys, People Data Labs keys, Object Storage bucket access, and email credentials.

## Trust Boundaries

- **Browser/mobile/CLI to API** -- all client input is untrusted. The API must authenticate requests and enforce workspace and role authorization server-side.
- **API to PostgreSQL** -- database queries must remain parameterized and scoped to the authenticated workspace.
- **API to Object Storage** -- object keys must not allow unauthorized read/write/delete of unrelated assets.
- **API to external network services** -- OpenAI, People Data Labs, arbitrary enrichment/OG URLs, and email delivery cross from trusted backend to external services. User-controlled URLs must be constrained to prevent SSRF and oversized responses.
- **Public to authenticated data** -- public portfolio and shared-designer endpoints intentionally expose limited data without login; all other workspace data requires auth and workspace membership.
- **Role boundaries inside a workspace** -- owner/admin/editor/member/viewer capabilities must be enforced on the server, not only in the UI.
- **MCP server/tool boundary** -- MCP output and API-token-authenticated tool calls are untrusted inputs that can read/write workspace data according to the token role.

## Scan Anchors

- Production API entry points: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/routes.ts`, `artifacts/api-server/src/mobile-routes.ts`, `artifacts/api-server/src/cli-routes.ts`, `artifacts/api-server/src/mcp-http.ts`.
- Authorization helpers: `artifacts/api-server/src/auth.ts` and `artifacts/api-server/src/permissions.ts`.
- Database schema/data layer: `lib/db/src/schema/schema.ts` and `lib/db/src/index.ts`.
- External calls and AI/data enrichment: `artifacts/api-server/src/enrichment.ts`, `artifacts/api-server/src/capture-analyzer.ts`, OpenAI/People Data Labs calls in route handlers.
- Upload/import surfaces: multer setup and photo/PDF/CSV/capture routes in `routes.ts`; Object Storage access under `/api/uploads/{*path}`.
- Public unauthenticated surfaces: health routes, `/api/shared/designers/:token`, `/api/lists/:slugOrId/public`, `/api/public/portfolios/:slug`, and `/api/public/portfolios/:slug/inquiries`.
- Dev-only/out-of-scope by default: `artifacts/mockup-sandbox`, `.migration-backup`, local screenshots/assets, node_modules, and build artifacts unless imported by production code.

## Threat Categories

### Spoofing

The API must trust only Clerk-verified identities or valid hashed `tap_` API tokens. Session and token resolution must never accept client-supplied user IDs, workspace IDs, roles, or email addresses as authority. Invitation and share tokens must be high-entropy and checked for expiration and intended scope.

### Tampering

Workspace data mutations must verify both membership and sufficient role before updating designers, lists, jobs, portfolios, API tokens, imports, capture entries, or system prompts. Client-supplied workspace IDs, slugs, designer IDs, list IDs, and generated AI outputs cannot be trusted without server-side scoping and validation.

### Repudiation

Sensitive workspace operations such as API token creation/revocation, member invitations/role changes, imports, capture analysis, and bulk data changes should log the acting user, workspace, operation, target, and timestamp so abuse can be investigated.

### Information Disclosure

Authenticated endpoints must return only data in the caller's workspace. Public portfolio/share endpoints must expose only intentionally public fields. Error responses and logs must not reveal secrets, database internals, full tokens, or private notes beyond the authorized caller. Cross-origin and caching behavior must not allow one origin/user to read another user's authenticated responses.

### Denial of Service

Public and authenticated endpoints that parse PDFs/CSV/images, call OpenAI/People Data Labs, fetch remote URLs, or generate recommendations need request-size, rate, timeout, and response-size limits. Public inquiry and portfolio view endpoints should avoid unbounded database writes from unauthenticated users.

### Elevation of Privilege

Admin-only and role-gated operations must be enforced server-side on every route. SQL must remain parameterized except for intentionally admin-only raw-query tooling. User-controlled URLs fetched server-side must be validated against private/link-local/loopback networks to prevent SSRF into internal services or metadata endpoints. File and object-storage keys must not permit path/key traversal across assets.
