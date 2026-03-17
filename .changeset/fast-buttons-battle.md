---
'@modern-js/app-tools': patch
---

fix: check `ts-node` existence via `package.json` instead of module resolution to avoid false positives from hoisted dependencies
