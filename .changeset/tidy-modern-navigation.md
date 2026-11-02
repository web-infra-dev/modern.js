---
'@modern-js/runtime': minor
'@modern-js/plugin-module-federation': patch
---

Add createModernReactRemote and useRemoteBasename for local Modern route mounts, with per-instance navigation synchronization. Generate local routes for selected application exports and use only the consumer basename for navigation, while preserving producer standalone routing and original server loader endpoints. Document producer responsibility for portable navigation and basename compatibility. Generate shared scope modules atomically when multiple exposes select the same producer route.
