---
'@modern-js/app-tools': minor
---

Export `closeServer` from the package root and wait for the Node development
server to close. Programmatic `dev` and `start` initialization now uses the
app-context command when no CLI build command is present, including occupied
port selection. Errors reported by the Node server close callback are
propagated to callers.
