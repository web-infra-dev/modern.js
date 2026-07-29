---
'@modern-js/app-tools': minor
---

Export `closeServer` from the package root. Programmatic `dev` and `start`
initialization now uses the app-context command when no CLI build command is
present, including occupied port selection.
