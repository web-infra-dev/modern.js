---
'@modern-js/server': patch
---

fix(server): add CORS headers to the lazy-compilation trigger endpoint so proxied domains (Whistle / Eden Proxy) can reach it cross-origin

fix(server): 为 lazy-compilation trigger 端点补充 CORS 响应头，使代理域名（Whistle / Eden Proxy）场景可跨源访问
