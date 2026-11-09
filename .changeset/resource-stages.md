---
'@modern-js/runtime': minor
'@modern-js/app-tools': minor
'@modern-js/utils': patch
---

feat: add staged resource loading: declare the stage of an `import()` with `stagedImport` from `@modern-js/runtime/resources`, configured by `performance.resourceStages`.

feat：新增按阶段加载，用 `@modern-js/runtime/resources` 的 `stagedImport` 声明 `import()` 在哪个阶段下载，通过 `performance.resourceStages` 配置。
