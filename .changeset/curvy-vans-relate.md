---
'@modern-js/builder-webpack-provider': patch
'@modern-js/builder-shared': patch
'@modern-js/prod-server': patch
'@modern-js/main-doc': patch
'@modern-js/server': patch
'@modern-js/types': patch
---

fix: support tools.devServer.header include string[] type, remove get & delete & apply api in hook or middleware api
fix: 支持 tools.devServer.header 包含字符串数组类型，移除 Hook 和 Middleware 中对 响应 Cookie 的获取、删除操作
