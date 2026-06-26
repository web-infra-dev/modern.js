# v3-app-no-bff

来源：当前 `packages/toolkit/create/template`（Modern.js v3 create 默认模板），裁剪为最小工程，
**未启用任何可选功能**。用于验证 `modernjs-feature-enable` 把一个干净 v3 app 从「未启用 BFF」
迁到「可安装 / 可构建的 BFF 已启用」形态。

- `modern.config.ts` ← `create/template/modern.config.ts`（`defineConfig({ plugins: [appTools()] })`）
- `tsconfig.json` ← `create/template/tsconfig.json`（extends @modern-js/tsconfig/base）
- `package.json` ← `create/template/package.json.handlebars`（react ^19、@modern-js/runtime + app-tools + tsconfig，版本用具体 3.0.0 占位）
- `src/modern.runtime.ts` / `src/routes/{layout,page}.tsx` ← 同模板

不复用任何带 `"new": "modern new"` 的历史 integration 工程（modern new 在 v3 已移除）。
