---
'@modern-js/app-tools': patch
---

Remove the programmatic `build` and `deploy` exports and restore CLI-owned
build and deploy lifecycles. Programmatic dev and start calls no longer change
CLI-only initialization behavior, and completed non-watch builds are no longer
closed automatically. Keep the public `closeServer` API and `DeployOptions`
type.
