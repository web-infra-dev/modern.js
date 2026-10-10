---
'@modern-js/app-tools': patch
---

Move the runtime script to the body before production inlining so streaming SSR hydration waits for initial router data. When runtime extraction is disabled, move the entry containing the runtime to the body and preload it from the head to preserve early downloading.
