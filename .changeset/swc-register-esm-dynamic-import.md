---
'@modern-js/app-tools': patch
---

fix(app-tools): when the swc require hook compiles server TypeScript to CommonJS, dynamic `import()` of an ESM-only package (one whose `exports` has no `require` condition, or one with top-level await) now falls back to a native `import()` instead of failing.

fix(app-tools)：swc require hook 把服务端 TypeScript 编译成 CommonJS 时，动态 `import()` 一个只能按 ESM 加载的包（`exports` 没有 `require` 条件，或包含顶层 await）不再报错，会回退到原生 `import()` 加载。
