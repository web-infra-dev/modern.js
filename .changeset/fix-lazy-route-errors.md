---
'@modern-js/runtime': patch
'@modern-js/runtime-utils': patch
---

fix: preserve lazy route import errors and share the import promise between non-blocking preloading and React.lazy so error boundaries receive the original module evaluation or chunk loading error

fix: 保留路由懒加载的原始异常，让非阻塞预加载与 React.lazy 共享加载 Promise，确保错误边界收到原始的模块执行或 chunk 加载错误
