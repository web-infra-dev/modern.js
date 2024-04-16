---
'@modern-js/server-core': patch
---

fix(server-core): new server should return 404 when can't found html template & 404,500 response shouldn't run afterRenderHook
fix(server-core): 新 server 在找不到 html 模版时应该返回 404, 且 404，500 响应不应该被 afterRenderHook 处理
