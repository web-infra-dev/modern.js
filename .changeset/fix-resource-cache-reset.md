---
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Pass the server-core fileReader singleton from the runtime server into development helpers so HTML templates, static resources, compiler filesystem initialization and rebuild invalidation use the same reader even when the two packages resolve different runtime-utils copies.
