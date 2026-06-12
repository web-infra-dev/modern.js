# real-v2-bff-hono

来源：`origin/v2:tests/integration/bff-hono`（裁剪，保留核心结构）。

- `modern.config.ts` ← `origin/v2:tests/integration/bff-hono/modern.config.ts`
  （`applyBaseConfig({ server.ssr.mode, runtime.router, bff.prefix, plugins: [bffPlugin()] })`）
- `package.json` ← `origin/v2:tests/integration/bff-hono/package.json`（裁剪 exports/typesVersions）
- `server/modern.server.ts` ← 同名文件（已是 v3 形态 `defineServerConfig`）
- `api/index.ts` ← `origin/v2:tests/integration/bff-hono/api/index.ts`（裁剪）
- `src/routes/{layout,page}.tsx` ← 同名文件

⚠️ `modern.config.ts` 使用仓库 integration 测试 helper `applyBaseConfig(...)`（**非标准用户配置包装**）。
本 fixture 用于验证：遇到 `applyBaseConfig` 时，`runtime` / `plugins` 等**结构性迁移不自动进行**、
明确进 manual 并提示「结构迁移未完成」；只做依赖升级 / import 路径等文件级安全改写。
核心结构（applyBaseConfig 包装、bffPlugin、runtime.router）不得被改成 v3 形态。
