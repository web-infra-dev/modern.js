---
'@modern-js/runtime': patch
'@modern-js/runtime-utils': patch
---

fix: emit completion scripts for deferred fields serialized as pending during streaming SSR

fix: 流式 SSR 中，初始序列化为等待状态的 deferred 字段完成后发送通知
