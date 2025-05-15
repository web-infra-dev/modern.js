---
'@modern-js/server-core': patch
---

fix(server): static middleware should ignore domain when detect whether the request is for static asset
fix(server): 资源中间件在检测请求是否为静态资源时，应该忽略 assetPrefix 中的域名
