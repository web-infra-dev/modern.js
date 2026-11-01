---
'@modern-js/server-core': minor
'@modern-js/prod-server': minor
---

feat(prod-server): compress production server responses with Brotli or gzip by default, including pages, static assets and BFF responses. Static assets are compressed once and cached, streaming responses are flushed after every chunk. Set `server.compress` to `false` to disable it.

feat(prod-server)：生产服务器默认使用 Brotli 或 gzip 压缩响应，包括页面、静态资源和 BFF 响应。静态资源只压缩一次并缓存，流式响应会在每个分块之后立即刷新。可以将 `server.compress` 设置为 `false` 来关闭。
