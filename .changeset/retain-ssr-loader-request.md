---
'@modern-js/runtime': patch
---

Reuse the original GET request for server loaders so deferred Bridge SSR data requests retain cancellation after garbage collection in affected Node versions. Preserve conversion of other methods to GET for loader execution.

服务端 loader 复用原始 GET Request，避免受影响的 Node 版本在垃圾回收后丢失渐进式 Bridge SSR 数据请求的取消信号。其他方法仍按原有逻辑转换为 GET 后执行 loader。
