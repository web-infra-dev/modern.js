---
'@modern-js/plugin-ssg': patch
'@modern-js/server-core': patch
'@modern-js/types': patch
---

fix: match prerendered SSG pages exactly and retain the entry SSR or CSR fallback for other paths. Skip non-2xx prerender responses with a warning instead of publishing error pages as successful HTML.

fix: 精确匹配 SSG 预渲染页面，其他路径保留入口 SSR 或 CSR 回退。跳过非 2xx 预渲染响应并输出警告，避免将错误页面作为成功的静态 HTML 发布。
