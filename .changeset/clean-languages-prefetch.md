---
'@modern-js/runtime': patch
'@modern-js/plugin-i18n': patch
'@modern-js/app-tools': patch
---

fix: isolate Bridge application SSR languages and route prefetching from the consumer and other mounts.

fix: 隔离 Bridge 应用的 SSR 语言与路由预取，避免读取消费者或其他挂载实例的数据。
