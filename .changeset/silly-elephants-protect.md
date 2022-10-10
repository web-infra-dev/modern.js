---
'@modern-js/builder-webpack-provider': patch
---

fix(builder): should not apply react refresh when dev.hmr is false

fix(builder): 修复 dev.hmr 为 false 时仍然会注入 react-refresh 的问题
