---
'@modern-js/runtime': patch
---

fix: 只需要在 SSR 模式下才调用 hydrateRoot 函数，修复必定进入 hydrateRoot 函数的问题
fix: only call hydrateRoot in ssr mode, fix bug that always call hydrateRoot
