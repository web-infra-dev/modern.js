---
'@modern-js/plugin-module-federation': minor
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Check remote manifests before admitting development SSR requests and use document-local HMR hints to prepare Node caches in the background. Discover loaded and dynamically registered nested dependencies without a Broker SSR subscription.

Development and production share the same update queue and request drain. Preserve compatible React Fast Refresh state across remote runtimes while keeping Node readiness independent from browser navigation and router revalidation.

Service responses select their matching client provider and carry nested dependency snapshots with the stream. A stable Service endpoint can change deployment without a Host cache update or expected-version conflict. Emit content-addressed Service client entries for production builds.
