---
'@modern-js/plugin-module-federation': patch
'@modern-js/runtime': patch
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Isolate SSR remote updates by application ownership and provider name plus build version, publish development manifests only when their resources are ready, and recheck concurrent publications after asynchronous remote checks.

Initialize rebuilt hosts with the selected live provider's loaded singletons of the same version so retained components and the host renderer use the same runtime dependencies.

Allow development compilation callbacks to finish when their SSR preparation is superseded, so a subsequent build can publish its resources and manifest.

Compare and forward development revisions independently of release versions. Service requests use the development revision when present to detect stale browser descriptors.
