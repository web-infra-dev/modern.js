---
'@modern-js/plugin': patch
---

fix(plugin): load regular CommonJS dependencies natively when reading config files to avoid jiti default interop failures with esbuild-bundled packages.
