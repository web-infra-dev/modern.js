---
'@modern-js/server-core': minor
'@modern-js/prod-server': minor
'@modern-js/runtime': patch
'@modern-js/runtime-utils': patch
'@modern-js/plugin-data-loader': patch
'@modern-js/plugin': patch
---

Add opt-in SSR application coordination for publishing refreshed server resources after response streams and producer work have drained. Preserve request-local loader, preparation, progressive application data and stream ownership through cancellation, and isolate HTML cache entries between published generations.

Remove retired optional loaders during selective publication and expand updates to the whole application when shared host manifests change.
