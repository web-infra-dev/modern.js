---
'@modern-js/app-tools': minor
---

feat: support lazy compilation for stream SSR by forcing route components eager

feat: 支持 stream SSR 开启 lazy compilation（路由组件强制 eager 编译）

When a stream SSR project enables `dev.lazyCompilation`, route component chunks
are now forced to compile eagerly via `lazyCompilation.test`, so the first-screen
async route assets (JS + CSS) are emitted at render time and injected correctly.
Non-route dynamic imports still compile lazily, and any user-provided
`dev.lazyCompilation.test` is preserved. String SSR and RSC are unaffected; if a
route component cannot be resolved to a file, the optimization is skipped (with a
warning) instead of silently leaving a route lazy.

当 stream SSR 项目开启 `dev.lazyCompilation` 时，路由组件 chunk 会通过
`lazyCompilation.test` 强制 eager 编译，使首屏 async 路由资源（JS + CSS）在渲染时
产出并正确注入；非路由动态 import 仍按需编译，用户自定义的 `dev.lazyCompilation.test`
保留。string SSR 与 RSC 不受影响；若路由组件无法解析到文件，则跳过该优化（并告警），
而非静默将路由留为 lazy。
