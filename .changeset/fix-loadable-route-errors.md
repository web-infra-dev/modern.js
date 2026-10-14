---
'@modern-js/runtime': patch
---

fix: share route imports during string SSR client navigation so loadable retries cannot hide original module evaluation errors. Retain loadable's existing chunk request retries and non-blocking navigation, and recognize CSS chunk request failures when retrying route imports.

fix: string SSR 客户端导航共享路由导入结果，避免 loadable 重试掩盖模块执行的原始异常，保留现有 chunk 请求重试和非阻塞导航行为，并在路由导入重试时识别 CSS chunk 请求失败。
