---
'@modern-js/runtime': minor
---

Support progressive hydration of independent applications. Return an initial snapshot with per-instance deferred data references at shell readiness, stream subsequent settlements separately, and restore pending values in the application's own router before hydration. Preserve existing complete snapshots and CSR mounting, and cancel pending data when an application is destroyed.
