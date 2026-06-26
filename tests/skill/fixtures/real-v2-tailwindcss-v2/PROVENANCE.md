# real-v2-tailwindcss-v2

来源：`origin/v2:tests/integration/tailwindcss/fixtures/tailwindcss-v2`（裁剪）。

- `modern.config.ts` ← 同名文件（`applyBaseConfig({ plugins: [tailwindcssPlugin()] })`）
- `package.json` ← 同名文件（`@modern-js/plugin-tailwindcss` + `tailwindcss ^2` + `autoprefixer` + `postcss`）
- `src/App.jsx` ← 同名文件（`import 'tailwindcss/*.css'`）

⚠️ `modern.config.ts` 使用 `applyBaseConfig(...)`。本 fixture 验证：
- 文件级安全改写照常：移除 `@modern-js/plugin-tailwindcss` 依赖、生成 `postcss.config.cjs`、
  移除 `tailwindcssPlugin()` 调用与 import；
- 但 `applyBaseConfig` 包装下的 `plugins` 结构整体仍进 manual、提示「结构迁移未完成」，
  不让用户误以为整 app 已自动迁完。
