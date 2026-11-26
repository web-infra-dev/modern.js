---
'@modern-js/runtime': minor
'@modern-js/app-tools': minor
'@modern-js/server-core': minor
'@modern-js/runtime-utils': minor
'@modern-js/plugin-i18n': minor
'@modern-js/types': minor
'@modern-js/utils': minor
---

feat: add partial prerendering with `server.ssr.mode: 'ppr'`, which prerenders the static part of each page at build time, sends it at once, and resumes the parts that need loader or request data when the request is served.

feat: 新增部分预渲染 `server.ssr.mode: 'ppr'`：构建时预渲染页面的静态部分，请求到达时立即发送，依赖 loader 数据或请求信息的部分在同一个响应中补齐。
