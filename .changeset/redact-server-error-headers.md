---
'@modern-js/server-core': patch
'@modern-js/prod-server': patch
---

fix(server): omit sensitive request headers from SSR and server error logs and support additional names via `server.logger.redactHeaders`

fix(server): SSR 和服务端错误日志默认过滤敏感请求头，支持通过 `server.logger.redactHeaders` 追加要过滤的请求头
