---
'@modern-js/runtime': patch
---

fix(runtime): string-mode SSR no longer drops a route's stylesheet when the same CSS is referenced by a non-stylesheet `<link>` (e.g. `<link rel="prefetch">`)

`LoadableCollector.emitStyleAssets` (string SSR) deduped injected route stylesheets against every `<link href>` in the template, so a `<link rel="prefetch">` for the same css URL (e.g. from `performance.prefetch`) made the real `<link rel="stylesheet">` be skipped and the route rendered unstyled. It now reuses the shared `hasStylesheetLink` helper (also used by streaming SSR), which only matches existing `<link rel="stylesheet">` tags.
