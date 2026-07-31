---
'@modern-js/app-tools': minor
---

Export the programmatic `build` API and its options from the package root, initialize the builder when `build` is supplied through the app-context command, and close completed non-watch builds before returning. The `onPrepare` dist cleanup now also recognizes the programmatic `appContext.command`, so programmatic `dev`/`build` clean stale output the same way the CLI does (still honoring `output.cleanDistPath` and running before `nestedRoutes.json` is generated).

从包根导出程序化 `build` API 及其选项，在通过 app-context command 传入 `build` 时初始化 builder，并在返回前关闭已完成的非 watch 构建。`onPrepare` 的 dist 清理现在也识别程序化的 `appContext.command`，使程序化 `dev`/`build` 与 CLI 一样清理陈旧产物（仍遵循 `output.cleanDistPath`，并在生成 `nestedRoutes.json` 之前执行）。
