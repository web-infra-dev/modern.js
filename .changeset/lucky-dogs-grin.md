---
'@modern-js/app-tools': patch
---

fix(app-tools): the hook `moidfyEntryImports` must run before `htmlPartials`,
builder onBeforeCreateCompiler hook would run in build mode, so we no need to run generateIndexCode twice.

fix(app-tools): 钩子 `moidfyEntryImports` 必须早于钩子 `htmlPartials` 运行,
builder onBeforeCreateCompiler 钩子也将在 build 模式运行, 我们不需要运行 generateIndexCode 函数两次.
