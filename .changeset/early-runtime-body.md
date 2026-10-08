---
'@modern-js/app-tools': patch
---

Move the runtime script to the body before production inlining so streaming SSR hydration waits for initial router data.
