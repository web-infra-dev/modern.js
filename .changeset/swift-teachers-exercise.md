---
'@modern-js/prod-server': patch
---

fix: should not do render if set location header and 302 status in middleware
fix: 如果在 middleware 中设置了 location 头和 302 状态码，则不应该走渲染逻辑
