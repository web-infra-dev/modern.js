---
'@modern-js/runtime': minor
---

Require function inputs for `createReactRemote`, `ReactRemote` and `createModernReactRemote`. Migrate `remote: 'shop/App'` to `remote: () => loadRemote('shop/App')`, or return a statically imported MF export. Keep automatic component and Bridge selection, typed exports, SSR data and assets, and route integration. Use a matching Core package with the function-only consumer contract.

统一 `createReactRemote`、`ReactRemote` 和 `createModernReactRemote` 的函数输入契约。将 `remote: 'shop/App'` 迁移为 `remote: () => loadRemote('shop/App')`，也可返回静态 import 的 MF 导出。保留普通组件和 Bridge 自动选择、类型推导、SSR 数据和资源及路由集成，需配套包含此契约的 Core 包。
