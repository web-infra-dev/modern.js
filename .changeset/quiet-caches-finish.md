---
'@modern-js/server-core': patch
---

Keep SSR cache revalidation running after a completed HTTP response while preserving cancellation for disconnected clients. Handle background render and stream failures without unhandled rejections or caching incomplete HTML.
