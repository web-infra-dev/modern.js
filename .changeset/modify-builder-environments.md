---
'@modern-js/app-tools': minor
---

feat(app-tools): add `modifyBuilderEnvironments` hook to transform the builder environments map before the builder is created

A new additive app-tools hook `modifyBuilderEnvironments` runs in `generateBuilder` after the framework's static environment merge and before `createBuilder`. It mirrors `modifyEntrypoints` as a transform-object async hook: each tapped callback receives `{ environments }` and may return a replacement map that chains to the next callback; tapping nothing leaves the environments byte-identical, so the change is fully backward compatible. This lets frameworks programmatically add environments (e.g. a custom browser worker environment), set per-environment `output`/`distPath`/ordering, or otherwise adjust the resolved environments map instead of being limited to a config-static merge.

feat(app-tools): 新增 `modifyBuilderEnvironments` hook，可在创建 builder 前变换 builder 环境表

新增的 app-tools hook `modifyBuilderEnvironments` 在 `generateBuilder` 中、框架静态环境合并之后、`createBuilder` 之前执行。它与 `modifyEntrypoints` 一致，是 transform-object 异步 hook：每个回调收到 `{ environments }`，可返回替换后的环境表并链式传给下一个回调；不挂载任何回调时环境表字节不变，完全向后兼容。框架可借此以编程方式新增环境（如自定义浏览器 worker 环境）、设置 per-environment 的 `output`/`distPath`/顺序，或调整已解析的环境表，而不再局限于静态配置合并。
