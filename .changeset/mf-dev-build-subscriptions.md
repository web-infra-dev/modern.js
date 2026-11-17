---
'@modern-js/plugin-module-federation': minor
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Subscribe to ready remote builds independently of DTS generation. Update Node applications in the background, propagate nested dependency changes without recompiling consumers, and check manifests before admitting development requests when subscriptions are unavailable.

Recover from a producer starting after its consumer. Preserve compatible React Fast Refresh state across remote runtimes while keeping Node updates independent from browser navigation and router revalidation. Manual refreshes use the prepared SSR generation for components, Bridge applications and Service applications.

Forward the producer's shared build version without rebuilding its consumers, and release nested provider graphs when their dependencies change or are removed.
