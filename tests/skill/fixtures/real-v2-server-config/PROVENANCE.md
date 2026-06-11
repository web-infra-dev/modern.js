# real-v2-server-config

来源：`origin/v2:tests/integration/server-config-v2`（裁剪，保留核心结构）。

- `modern.config.ts` ← `origin/v2:tests/integration/server-config-v2/modern.config.ts`
  （`applyBaseConfig({ plugins: [serverPlugin()], runtime: { router: false, state: false } })`）
- `package.json` ← 同名文件（保留 `modernConfig.runtime` 字段——v2 也支持在 package.json 配 runtime）
- `server/index.ts` ← 同名文件（**v2 存量自定义 server**：`unstableMiddleware` / `afterMatch` /
  `afterRender`，import 自 `@modern-js/runtime/server`，是真实迁移/人工目标）
- `server/modern.server.ts` ← 同名文件（v3 形态 `defineServerConfig`）
- `src/App.tsx` ← 同名文件

⚠️ 同时覆盖两件事：
1. `applyBaseConfig(...)` 包装 → `runtime`/`plugins` 结构性迁移进 manual、提示「结构迁移未完成」。
2. `server/index.ts` 的 `unstableMiddleware`/`afterRender` hook 存量形态 → 进 manual
   （`server/index.ts` → `server/modern.server.ts` + Hono Context），import 路径
   `@modern-js/runtime/server` → `@modern-js/server-runtime` 为文件级安全改写。
3. `package.json` 的 `modernConfig.runtime` → 进 manual（需迁到 `src/modern.runtime.ts`）。
核心结构不得被改成 v3 形态。
