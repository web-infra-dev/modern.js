---
'@modern-js/server-core': minor
'@modern-js/prod-server': minor
---

feat(prod-server): compress static files served by the production server with Brotli or gzip by default. Each file is compressed once and cached, and gets `Vary: Accept-Encoding` whether it is sent compressed or not. SSR pages and BFF responses are not compressed. Set `server.compress` to `false` to disable it.

feat(prod-server)：生产服务器默认使用 Brotli 或 gzip 压缩其提供的静态文件。每个文件只压缩一次并缓存，无论是否被压缩都会带上 `Vary: Accept-Encoding`。SSR 页面和 BFF 响应不会被压缩。可以将 `server.compress` 设置为 `false` 来关闭。
