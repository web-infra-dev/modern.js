# legacy-v2-app-config（存量 2.0 形态 edge，非 happy path）

这是 **v2 早期 / 存量** 应用形态，不是当前 generator 默认（默认见 `real-v2-generator-app`）。
保留它是因为 `App.config` / `App.init` / 自定义 `server/index.ts` 仍是 v2 分支真实存量结构
（参考 `origin/v2:tests/integration/entries/fixtures/app-entry/src/App.tsx` 等仍有 `App.init`）。

覆盖的迁移路径：
- `App.config` → 抽取生成 `src/modern.runtime.ts`
- `App.init` → manual（运行时插件）
- `server/index.ts`（`unstableMiddleware`）→ manual（`modern.server.ts` + Hono）
- `@modern-js/runtime/bff` → `@modern-js/plugin-bff/client` + 补依赖 + `bffPlugin()`
- `dev.port` → `server.port`、tailwind 移除、`html.appIcon`/`ssr` → manual
- React 18 `useRuntimeContext()` → `useContext(RuntimeContext)`

不作为主 happy path，仅作存量形态自动迁移 + manual 边界验证。
