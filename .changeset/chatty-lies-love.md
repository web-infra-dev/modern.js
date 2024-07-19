---
'@modern-js/server-core': patch
---

fix: new server middleware support get body, if request.method is post
fix: 如果请求是 post, 新 server middlewares 可以拿到 body 数据
