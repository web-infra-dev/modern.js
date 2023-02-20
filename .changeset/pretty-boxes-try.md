---
'@modern-js/plugin-router-v5': patch
'@modern-js/runtime': patch
'@modern-js/app-tools': patch
'@modern-js/utils': patch
---

fix: should not assign nestedRoutesEntry to entrypoint if use v5 router
fix: 使用 v5 路由的时候，不应该在 entrypoint 上挂载 nestedRoutesEntry 属性
