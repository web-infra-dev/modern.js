---
'@modern-js/server-core': patch
---

perf: trim per-request work in the render path and set Server-Timing with a single header update

perf: 减少渲染链路中每个请求的额外开销，并一次性写入 Server-Timing 响应头
