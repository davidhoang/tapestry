# Tapestry Mobile

Expo companion app for the Tapestry web product. Reuses the existing
`/api/mobile/*` endpoints from `artifacts/api-server` over a Clerk-issued
bearer token. No backend code lives here.

## API base URL

`lib/api.ts` resolves the api-server origin in this order:

1. `EXPO_PUBLIC_API_URL` env var (preferred for production native builds)
2. `expo.extra.apiUrl` in `app.json` (alternative, set via EAS update)
3. `EXPO_PUBLIC_DOMAIN` env var (set by the local dev script)
4. `window.location.origin` (web bundle — works for both dev preview and
   any web export deployed alongside the api-server)
5. Expo Go packager `hostUri` (LAN dev fallback)

### Local development

The `dev` script already sets `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN`
so requests hit the running api-server workflow on the same Replit host.

To override this (e.g. point a local Expo Go session at a hosted
api-server), set `EXPO_PUBLIC_API_URL` in your shell before running
`pnpm --filter @workspace/tapestry-mobile run dev`.

### Production native builds (iOS / Android)

Native binaries have no `window.location`, so an explicit URL is
required. Two ways to set it:

```bash
# Option A: env var at build time
EXPO_PUBLIC_API_URL=https://your-deployed-api.example.com \
  pnpm --filter @workspace/tapestry-mobile run build
```

```jsonc
// Option B: app.json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-deployed-api.example.com"
    }
  }
}
```

If neither is set, `apiFetch` requests will fail loudly with a relative
URL — by design, so the misconfiguration is obvious instead of silently
hitting the wrong host.

### Production web export

The web export is deployed behind the same application router as the
api-server, so `window.location.origin` resolves correctly without any
extra configuration.
