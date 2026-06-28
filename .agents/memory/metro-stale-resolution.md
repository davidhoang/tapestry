---
name: Metro stale module resolution after installing mobile deps
description: Why a freshly-installed Expo/React Native package reports "Unable to resolve module" until the expo workflow restarts.
---

After adding a new dependency to an Expo artifact (e.g. `@sentry/react-native`), Metro can keep reporting `UnableToResolveError: <pkg> could not be found within the project` for that package — even though it is correctly listed in `package.json` and symlinked under the artifact's `node_modules` (verify with `ls -la <artifact>/node_modules/@scope/`).

**Why:** Metro caches module resolution from when the dev server first started. A package installed *after* the server booted is invisible until the resolver cache is rebuilt.

**How to apply:** Restart the expo workflow (e.g. `artifacts/<slug>: expo`) after any new mobile dependency install, then re-verify. Don't waste time hunting for a "broken" install when the symlink and `package.json` are both correct — it's almost always the stale cache.

**How to verify a web export actually bundles** (catches issues the screenshot tool can miss): fetch the entry bundle directly and confirm HTTP 200 + JS body (not a JSON error payload):
`curl -s -w "__HTTP_%{http_code}__" "http://localhost:<port>/node_modules/.pnpm/expo-router@<ver…>/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&...&transform.routerRoot=app"`
A failed bundle returns `{"type":"UnableToResolveError",...}` with the exact offending module + import stack. Grab the real bundle URL (with the `.pnpm` hash) from the browser console of a screenshot — a guessed path like `/index.bundle` 404s and resolves from the wrong root, giving a misleading error.
