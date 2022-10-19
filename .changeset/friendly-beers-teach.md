---
'@modern-js/builder-shared': patch
'@modern-js/builder-webpack-provider': patch
---

fix(builder): only apply one tsChecker plugin when multiple targets

fix(builder): 当同时存在多个 target 时，仅启用一个 tsChecker 插件
