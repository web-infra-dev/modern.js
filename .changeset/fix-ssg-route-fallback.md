---
'@modern-js/plugin-ssg': patch
'@modern-js/server-core': patch
'@modern-js/types': patch
'@modern-js/mcp-apps': patch
---

fix: match prerendered SSG pages exactly and use available entry SSR or CSR fallbacks for other paths. Redirect trailing-slash SSG URLs to their canonical paths while preserving query strings. Skip non-2xx prerender responses with a warning instead of publishing error pages as successful HTML.

fix: 精确匹配 SSG 预渲染页面，其他路径使用可用的入口 SSR 或 CSR 回退。将带尾部斜杠的 SSG URL 重定向到对应路径，并保留查询参数。跳过非 2xx 预渲染响应并输出警告，避免将错误页面作为成功的静态 HTML 发布。

fix: align the MCP Apps server-runtime peer dependency with the current release.

fix: 同步 MCP Apps 的 server-runtime peer 依赖版本到当前发布版本。
