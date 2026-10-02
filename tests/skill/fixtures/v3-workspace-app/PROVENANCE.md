# v3-workspace-app（负向 fixture）

模拟一个**已经是 v3** 的 workspace/monorepo 应用：`@modern-js/*` 用 `workspace:*` 协议、
React 19、`defineConfig({ plugins: [appTools()] })`、约定式 `routes/` + `src/modern.runtime.ts`，
**没有任何 v2-only 信号**（无顶层 runtime、无 `appTools({ bundler })`、无 applyBaseConfig、
无 plugin-tailwindcss、无 runtime/bff|server import、无 App.config/init、无 pages、无自定义 server）。

预期：
- `scan-project.mjs` 判为 **ambiguous → 阻断**（非 0 退出、不写 context），不让 skill 流程继续。
- 直接跑 `migrate.mjs` 时**二次保护**：打印中止原因 + exit 1，**不改任何文件**（workspace:* 保留、不造 changes）。

防止把已是 v3 的 workspace 项目误判为 v2 并强升依赖 / 误改配置。
