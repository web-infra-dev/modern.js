---
'@modern-js/runtime': patch
---

Start the Node SSR response pipeline only once when React re-enters the ready callback, preventing resolved lazy remote components from aborting subsequent all-ready responses.
