---
'@modern-js/prod-server': patch
---

fix(prod-server): the server need use headersSent without use flushHeader
fix(prod-server): 没有 flushHeader 时 server 应该使用 headersSent
