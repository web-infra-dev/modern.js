---
'@modern-js/app-tools': patch
---

fix(app-tools): keep dynamic `import()` when the swc require hook compiles server TypeScript to CommonJS, so ESM-only dependencies can still be loaded.

fix(app-tools)：swc require hook 将服务端 TypeScript 编译为 CommonJS 时保留动态 `import()`，避免 ESM-only 依赖被改写成 `require()` 后加载失败。
