---
'@modern-js/plugin-module-federation': patch
'@modern-js/runtime': patch
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Isolate SSR remote updates by application ownership and federation build identity, keep development manifests aligned with their compiled runtimes, and recheck concurrent publications after asynchronous remote checks.

Initialize rebuilt hosts with the selected live provider's loaded singletons of the same version so retained components and the host renderer use the same runtime dependencies.

Allow development compilation callbacks to finish when their SSR preparation is superseded, so a subsequent build can publish its resources and manifest.
