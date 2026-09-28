# v3-legacy-tsconfig-bff

来源：Modern.js 3 创建模板在 tsconfig bundler 基线之前的形态。

- `tsconfig.json` ← `packages/toolkit/create/template/tsconfig.json`（commit `d075343d39`，含 `"baseUrl": "./"`、`extends @modern-js/tsconfig/base`）
- `package.json`：CommonJS（无 `type` 字段）的 v3 BFF 应用，`@modern-js/*` 为固定 3.x 版本（按续迁移处理）
- `api/lambda/index.ts` + `shared/greeting.ts`：最小 BFF 函数，经相对路径引用 shared

用于验证 `scripts/migrate-tsconfig.mjs`：删除默认 `baseUrl`、补 `@api/*` 别名、生成 `tsconfig.server.json`；
`tests/integration/tsconfig-migrate-codemod` 也用它做 TypeScript 6 验收。
