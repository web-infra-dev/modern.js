---
'@modern-js/plugin-module-federation': minor
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Subscribe to ready remote builds independently of DTS generation. Update Node applications in the background, propagate nested dependency changes without recompiling consumers, and check manifests before admitting development requests when subscriptions are unavailable.

Recover from a producer starting after its consumer. Revalidate mounted routers after Node updates and preserve compatible React Fast Refresh state across remote runtimes. Reload after applying static builds or Service exposes so later mounts use matching Service metadata.

Use artifact content versions without forcing unchanged compilers to rebuild, and release nested provider graphs when their dependencies change or are removed.
