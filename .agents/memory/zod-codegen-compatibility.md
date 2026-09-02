---
name: Zod codegen compatibility
description: OpenAPI formats can generate Zod 4-only helpers in a workspace pinned to Zod 3.
---

When the workspace uses Zod 3, avoid OpenAPI integer and email formats in newly generated API schemas unless the generator is configured for Zod 3; use compatible number/string constraints instead.

**Why:** The installed Orval output can emit `zod.int()` and `zod.email()`, which do not exist in the pinned Zod 3 runtime and break the library typecheck after codegen.

**How to apply:** After any OpenAPI change, run codegen and the library typecheck before adding server routes; if generation emits unsupported helpers, adjust the schema constraints or upgrade the shared Zod version deliberately.