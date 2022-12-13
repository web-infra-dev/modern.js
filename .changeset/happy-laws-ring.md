---
'@modern-js/runtime': patch
---

fix(runtime): apply babel-plugin-ssr-loader-id when SSR is not used

fix(runtime): 在未启动 SSR 时需要注册 babel-plugin-ssr-loader-id
