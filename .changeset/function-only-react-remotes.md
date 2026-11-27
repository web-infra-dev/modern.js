---
'@modern-js/runtime': minor
'@modern-js/plugin-module-federation': patch
---

Require function inputs for `createReactRemote`, `ReactRemote` and `createModernReactRemote`. Migrate `remote: 'shop/App'` to `remote: () => loadRemote('shop/App')`, or return a statically imported MF export. Keep automatic component and Bridge selection, typed exports, SSR data and assets, and route integration. Update Core dependencies and peer requirements to `0.0.0-feat-enhanced-runtime-unification-20261110060527`, which includes the function-only consumer contract.

统一 `createReactRemote`、`ReactRemote` 和 `createModernReactRemote` 的函数输入契约。将 `remote: 'shop/App'` 迁移为 `remote: () => loadRemote('shop/App')`，也可返回静态 import 的 MF 导出。保留普通组件和 Bridge 自动选择、类型推导、SSR 数据和资源及路由集成，将 Core 依赖及 peer 约束升级至包含此契约的 `0.0.0-feat-enhanced-runtime-unification-20261110060527`。
