---
'@modern-js/plugin-module-federation': minor
'@modern-js/runtime': minor
'@modern-js/server-core': minor
'@modern-js/prod-server': minor
'@modern-js/server': patch
'@modern-js/app-tools': patch
'@modern-js/plugin-data-loader': patch
'@modern-js/plugin': patch
'@modern-js/runtime-utils': patch
---

feat: coordinate SSR cache updates, development HMR readiness, and Service App deployment selection for Module Federation.

- Add opt-in SSR application coordination in `@modern-js/server-core` and `@modern-js/prod-server` to drain active streams/loaders before publishing refreshed server resources, isolate per-generation HTML cache and request work, and support configurable `wait` / `csr` / `reject` request policies during updates.
- Expose `shouldUpdateRemote` and `updateRemotes` (including `defer: 'after-response'`, explicit `manifest` / `moduleInfo` separation, and whole-snapshot `GlobalModuleInfo` diffing) via `@modern-js/runtime/mf/update`, automatically choosing selective `entries` reloads or full `application` rebuilds while preserving shared singleton consistency and disposing detached Node providers.
- Coordinate shared browser/Node development `buildVersion` publication, check remote manifests before admitting development SSR requests without requiring a Broker subscription, preserve compatible React Fast Refresh state across remote runtimes, and support independent Service App deployments and nested SSR dependency snapshots.

feat: 协调 Module Federation 的 SSR 缓存更新、开发态 HMR 就绪校验与 Service App 独立部署选择。

- 在 `@modern-js/server-core` 与 `@modern-js/prod-server` 中新增可选的 SSR 应用协调能力，在排空活跃流与 loader 后发布新版本服务端资源，按代隔离 HTML 缓存与请求级上下文，并支持更新期间的 `wait` / `csr` / `reject` 请求策略。
- 通过 `@modern-js/runtime/mf/update` 暴露 `shouldUpdateRemote` 与 `updateRemotes`（支持 `defer: 'after-response'`、明确的 `manifest`/`moduleInfo` 区分以及完整 `GlobalModuleInfo` 差量对比），自动选择局部 `entries` 重载或整应用 `application` 重建，同时保证共享单例一致性并及时释放失效的 Node 生产者实例。
- 协同开发态浏览器/Node 共享 `buildVersion` 发布，无需 Broker 订阅即可在接收开发态 SSR 请求前检查远端 manifest 就绪状态，保留跨远程运行时的 React Fast Refresh 状态，并支持 Service App 独立部署切换与嵌套 SSR 依赖快照透传。
