---
'@modern-js/runtime': patch
---

perf: cache the inlined css and js assets read during SSR instead of reading them on every request

perf: SSR 内联 CSS 和 JS 资源时缓存文件内容，不再在每次请求时读取文件
