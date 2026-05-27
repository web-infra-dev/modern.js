---
'@modern-js/app-tools': minor
---

feat: enable Rspack lazy compilation by default in CSR dev

feat: 纯 CSR 开发环境下默认开启 Rspack 按需编译

Pure client-side-rendering apps now compile route-level dynamic imports on first
access instead of upfront, speeding up dev cold start. The default is scoped to
pure CSR only — apps using SSR (string or stream), RSC, or SSG keep eager
compilation, because their first-screen chunk/CSS injection relies on those
chunks being built at render time. Disable it per project with
`dev.lazyCompilation: false`.

纯 CSR 应用的路由级动态 import 改为首次访问时按需编译，加快 dev 冷启动。该默认仅作用于
纯 CSR；使用 SSR（string/stream）、RSC、SSG 的应用保持全量编译（它们的首屏 chunk/CSS
注入依赖渲染时 chunk 已产出）。可通过 `dev.lazyCompilation: false` 按项目关闭。
