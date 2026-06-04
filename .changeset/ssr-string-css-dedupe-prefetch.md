---
'@modern-js/runtime': patch
---

fix(runtime): SSR string mode no longer drops a route's stylesheet when the same CSS is referenced by a non-stylesheet `<link>` (e.g. `<link rel="prefetch">`)

In string-mode SSR, `LoadableCollector` deduped the stylesheets it injects against **every** `<link href>` in the template, including `<link rel="prefetch">`/`<link rel="preload">`. When `performance.prefetch` is enabled it emits `<link rel="prefetch" href=".../xxx.css">`, which caused the real `<link rel="stylesheet">` to be skipped, so route-level CSS was prefetched but never applied (first screen rendered unstyled). The dedupe now only considers existing `<link rel="stylesheet">` tags.
