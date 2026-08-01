---
'@modern-js/server-core': patch
'@modern-js/plugin-bff': patch
---

fix: correct the "Middlware" typo in BFF middleware identifiers — the exported `PublicMiddlwareOptions` type from `@modern-js/server-core` is renamed to `PublicMiddlewareOptions`, and the internal `routeMiddlwares` variable in `@modern-js/plugin-bff` is renamed to `routeMiddlewares`
fix: 修正 BFF 中间件标识符里的 "Middlware" 拼写错误——`@modern-js/server-core` 导出的 `PublicMiddlwareOptions` 类型更名为 `PublicMiddlewareOptions`，`@modern-js/plugin-bff` 内部变量 `routeMiddlwares` 更名为 `routeMiddlewares`
