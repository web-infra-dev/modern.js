# real-v2-generator-app-js

来源：`origin/v2` 的 MWA generator **JS 模板**，裁剪为最小可迁移工程。

- `modern.config.js` ← `origin/v2:packages/generator/generators/mwa-generator/templates/js-template/modern.config.js.handlebars`
  （`module.exports = { runtime: { router: true }, plugins: [appTools({ bundler })] }`）
- `src/modern.runtime.js` ← `origin/v2:.../js-template/src/modern.runtime.js.handlebars`（空 `defineRuntimeConfig({})`）
- `package.json` ← 按 base-template JS 形态（固定 2.x 版本，react ^18.3.1）

用于验证 **JS / `module.exports` 静态配置**也能走自动迁移主路径：
`appTools({ bundler }) → appTools()`、顶层 `runtime` 合并进空的 `src/modern.runtime.js`、
固定 2.x 依赖升 3.0.0。不能被误报成「函数式/动态配置」。
