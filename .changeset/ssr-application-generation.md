---
"@modern-js/server-core": minor
"@modern-js/prod-server": minor
"@modern-js/plugin-data-loader": patch
---

Add opt-in process-local SSR application resource publication before request middleware, with bounded admission, validated CommonJS resource rebuilding and generation-specific HTML cache keys. Propagate request work into standalone data loaders. Keep the listening HTTP server while updates drain and publish, and keep SSR unavailable after failed preparation until an explicit retry.
