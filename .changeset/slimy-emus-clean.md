---
'@modern-js/runtime': patch
'@modern-js/server-core': patch
---

fix: ssrContext get protocal from x-forwarded-proto first, then new server middleware support rewrite request
fix: ssrContext 优先从 x-forwarded-proto 取协议, 另外新 server middleware 支持重写 request
