---
'@modern-js/plugin-module-federation': patch
'@modern-js/server-core': patch
---

Expose the explicit static-consumption contract and request-to-entry scope resolver for selective SSR updates. Restore selected dependency URLs when a rebuilt producer registers a dependency dynamically. Preserve normal static-asset middleware while serving, using the early asset bypass only while SSR admission is closed.
