---
'@modern-js/builder-rspack-provider': patch
'@modern-js/builder-shared': patch
'@modern-js/builder-webpack-provider': patch
'@modern-js/server': patch
---

fix(server): move devMiddleware from modern/server to builder-provider

fix(server): 从 @modern-js/server 中移除 devMiddleware 相关实现，改为由调用方注入(builder-webpack-provider / builder-rspack-provider)
