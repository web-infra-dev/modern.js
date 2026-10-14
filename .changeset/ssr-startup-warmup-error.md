---
'@modern-js/server-core': patch
---

Wait for existing Node production SSR bundle warmup before starting the server, and preserve required SSR entry loading errors instead of starting with missing render modules. Non-SSR/static routes are not treated as required SSR entries. Missing optional loader bundles and manifests remain supported; CSR-only, RSC and development startup behavior is unchanged. Lazy route modules are not eagerly loaded.
