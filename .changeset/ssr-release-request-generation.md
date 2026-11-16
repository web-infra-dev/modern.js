---
'@modern-js/server-core': patch
---

Release request-injected SSR generation resources after response streams and registered producer work settle, so retained HTTP async contexts cannot keep retired application bundles alive.
