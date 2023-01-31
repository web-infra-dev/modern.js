---
'@modern-js/builder-webpack-provider': patch
---

fix(builder): should not emit async chunk when target is web-worker

fix(builder): 修复 target 为 web-worker 时产物中出现 async chunk 的问题
