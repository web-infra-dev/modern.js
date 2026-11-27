---
'@modern-js/runtime': minor
'@modern-js/plugin-data-loader': patch
---

feat(runtime): add native Memory Route support via `router.memory` config and React APIs (`MemoryRouteProvider`, `useMemoryRoute`, `<ModernRoot memoryRoute={...} />`) across CSR, SSR, hydration, and isolated multi-instance roots.

feat(runtime): 原生支持 Memory Route，提供 `router.memory` 运行时配置与 React API（`MemoryRouteProvider`、`useMemoryRoute`、`<ModernRoot memoryRoute={...} />`），完整覆盖 CSR、SSR、水合与多实例隔离场景。
