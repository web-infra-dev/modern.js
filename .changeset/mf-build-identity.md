---
'@modern-js/plugin-module-federation': patch
'@modern-js/runtime': patch
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Isolate SSR remote updates by application ownership and provider name plus build version, publish development manifests only when their resources are ready, and recheck concurrent publications after asynchronous remote checks.

Initialize rebuilt hosts with the selected live provider's loaded singletons of the same version so retained components and the host renderer use the same runtime dependencies.

Allow development compilation callbacks to finish when their SSR preparation is superseded, so a subsequent build can publish its resources and manifest.

Assign one development build version before the browser and Node compilations start. Rebuild both targets after either target changes, and publish only their matching completed outputs. Service requests use the same version to reject stale descriptors with ordinary HTTP 409 without replaying the request.

Detach drained application cache adapters before a full rebuild so missing native dependency metadata can fall back without skipping remote and snapshot cleanup.
