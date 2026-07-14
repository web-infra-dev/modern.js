---
'@modern-js/server-core': patch
---

fix(server-core): share the hono request context storage across duplicated module copies via a process-global AsyncLocalStorage, so BFF handlers no longer fail with "Can't call useContext out of server scope" when the host and plugin resolve different server-core instances
fix(server-core): 通过进程级 AsyncLocalStorage 让 hono 请求上下文在重复加载的模块副本间共享，宿主与插件解析到不同 server-core 实例时 BFF 不再报 "Can't call useContext out of server scope"
