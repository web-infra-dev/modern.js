---
'@modern-js/plugin-module-federation': patch
'@modern-js/server-core': patch
'@modern-js/app-tools': patch
'@modern-js/runtime': patch
---

Infer selective SSR cache updates from the compiled and observed dependencies. Publish renderers through a stable SSR loader and support an application-wide wait or a per-entry CSR request policy. Restore selected dependency URLs when a rebuilt producer registers a dependency dynamically. Preserve normal static-asset middleware while serving, using the early asset bypass only while SSR admission is closed.
