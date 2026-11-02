---
'@modern-js/app-tools': patch
---

fix: surface the original plugin load error instead of the ESM fallback error. `import()` now receives a file URL so plugins can be resolved on Windows.
