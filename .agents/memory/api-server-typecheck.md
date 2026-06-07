---
name: api-server typecheck is not a build gate
description: artifacts/api-server fails tsc but ships via esbuild; scope "web build" checks to the web package
---

api-server fails `tsc` with a large backlog of pre-existing errors, but it builds
and runs fine because its build transpiles with esbuild (no typechecking).

**Why this matters:** these errors are NOT regressions and do NOT block the web
app build — api-server is a separate package.

**How to apply:** for any task scoped to "typecheck errors blocking web builds",
verify against the web package only (`@workspace/tapestry`). Do not assume you
caused the api-server errors, and do not scope-creep into fixing them unless
explicitly asked.
