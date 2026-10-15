---
'@modern-js/server-core': patch
---

perf: write Node.js response bodies with a stream reader loop instead of `pipeTo(Writable.toWeb(res))`

perf: 使用流读取循环代替 `pipeTo(Writable.toWeb(res))` 写入 Node.js 响应体
