---
'@modern-js/runtime': patch
---

fix(runtime): collect `Helmet` per request in streaming SSR, so head tags do not leak between requests.

fix(runtime)：流式 SSR 按请求收集 `Helmet`，head 标签不再串到其他请求。
