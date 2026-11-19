---
'@modern-js/runtime': minor
---

feat: add `prefetch` from `@modern-js/runtime/prefetch`, a low-priority queue for async chunks that starts after the page is idle, limits concurrent chunk requests, sends them with `fetchpriority="low"`, and starts a queued chunk at normal priority as soon as the page requests it
