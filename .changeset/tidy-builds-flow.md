---
'@modern-js/app-tools': minor
---

Export the programmatic `build` API and its options from the package root, initialize the builder when `build` is supplied through the app-context command, and close completed non-watch builds before returning. Dist cleanup now runs inside the `dev`/`build` commands (honoring `output.cleanDistPath`), so programmatic `dev`/`build`/`deploy` clean stale output the same way the CLI does, while `deploy({ skipBuild: true })` preserves the existing dist.

从包根导出程序化 `build` API 及其选项，在通过 app-context command 传入 `build` 时初始化 builder，并在返回前关闭已完成的非 watch 构建。dist 清理改到 `dev`/`build` 命令内部执行（遵循 `output.cleanDistPath`），使程序化 `dev`/`build`/`deploy` 与 CLI 一样清理陈旧产物，同时 `deploy({ skipBuild: true })` 保留已有 dist。
