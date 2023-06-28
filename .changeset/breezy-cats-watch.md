---
'@modern-js/prod-server': patch
---

fix: should use `req.logger` to log error when request handler throw error
fix: 当请求处理函数出错时，应该使用 `req.logger` 来上报错误日志
