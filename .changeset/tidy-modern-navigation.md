---
'@modern-js/runtime': minor
'@modern-js/plugin-module-federation': patch
---

Add createModernReactRemote and useRemoteBasename for local Modern route mounts, with per-instance navigation synchronization. Mount selected application content at the consumer-owned path without repeating the selector, while preserving producer standalone routing. Document producer responsibility for portable navigation and basename compatibility. Generate shared scope modules atomically when multiple exposes select the same producer route.
