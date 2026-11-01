---
'@modern-js/server-core': minor
---

feat(server-core): set `Cache-Control` for static files served by the production server. Build assets with a content hash get `public, max-age=31536000, immutable`, other static files get `no-cache`. Static files also get `ETag` and `Last-Modified` and answer conditional requests with `304`. Configure or disable it with `server.staticCacheControl`.

feat(server-core)：生产服务器为静态文件设置 `Cache-Control`。文件名包含内容哈希的构建产物使用 `public, max-age=31536000, immutable`，其他静态文件使用 `no-cache`。静态文件还会带上 `ETag` 和 `Last-Modified`，并对条件请求返回 `304`。可以通过 `server.staticCacheControl` 修改或关闭。
