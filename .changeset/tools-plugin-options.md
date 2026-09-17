---
'@modern-js/builder': minor
---

feat(builder): expose the full Rsbuild plugin options through `tools.less`, `tools.sass` and the new `tools.svgr`, so that plugin-level options such as `parallel`, `include`, `exclude` and `rewriteUrls` can be configured. The legacy loader-level form of `tools.less` / `tools.sass` and the `output.svgDefaultExport` / `output.disableSvgr` options keep working, are marked as deprecated and print a migration hint in development.

feat(builder): `tools.less`、`tools.sass` 与新增的 `tools.svgr` 支持传入 Rsbuild 插件的完整选项，`parallel`、`include`、`exclude`、`rewriteUrls` 等插件级选项均可配置。旧的 loader 级 `tools.less` / `tools.sass` 写法与 `output.svgDefaultExport` / `output.disableSvgr` 继续生效，标记为废弃并在开发环境打印迁移提示。
