# real-v2-generator-app

来源：`origin/v2` 的 MWA generator 默认模板，裁剪为最小可迁移工程。

- `modern.config.ts` ← `origin/v2:packages/generator/generators/mwa-generator/templates/ts-template/modern.config.ts.handlebars`
  （`defineConfig({ runtime: { router: true }, plugins: [appTools({ bundler })] })`）
- `src/modern.runtime.ts` ← `origin/v2:packages/generator/generators/mwa-generator/templates/ts-template/src/modern.runtime.ts.handlebars`
  （空的 `defineRuntimeConfig({})`）
- `package.json` ← `origin/v2:packages/generator/generators/mwa-generator/templates/base-template/package.json.handlebars`
  （`react/react-dom ^18.3.1`、`@modern-js/runtime` + `@modern-js/app-tools` + `@modern-js/tsconfig`）
- `src/routes/{layout,page}.tsx` ← `origin/v2` entry-generator 约定式路由默认模板

这是**用户工程默认形态**（`defineConfig`），用于验证 v2→v3 **自动迁移**能力：
依赖升级、`appTools({ bundler }) → appTools()`、`modern.config.runtime` 合并进空的
`src/modern.runtime.ts`、React 18 不生成 `use()`。核心结构不得被改成 v3 形态。
