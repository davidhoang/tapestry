---
name: zod version pin & @hookform/resolvers boundary
description: Why zod is pinned and why @hookform/resolvers must stay on v3 in the web app
---

# zod is pinned via a pnpm override

**Why:** `openai` pulls a zod 4.x copy while the rest of the repo uses 3.25.x.
Two physical zod copies break type identity and produce spurious resolver/schema
"not assignable" errors. The pinned 3.25.x release still exposes the `zod/v4`
subpath, so `import { z } from "zod/v4"` keeps working with a single copy.

**How to apply:** if resolver/schema "not assignable" errors mention two zod
versions, run `pnpm why zod` and collapse to one copy before editing app code.

# Keep @hookform/resolvers on v3 — do NOT upgrade

**Why:** resolvers v4/v5 use a 3-generic `Resolver<Input,ctx,Output>`. Any zod
schema with `.default()` makes Input ≠ Output, which then mismatches `useForm<T>`
and regressed every hand-written form at once. Upgrading is a net loss.

**How to apply:** keep resolvers at v3. The one form built from a drizzle-zod
(zod v4) schema needs `zodResolver(schema as any)` to bridge the v4-schema /
v3-resolver type boundary; runtime is fine because v4 schemas implement the same
parse API resolvers v3 calls. Keep that cast isolated — don't spread it to other
forms.
