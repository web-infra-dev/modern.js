---
'@modern-js/builder-rspack-provider': patch
---

fix(builder): should not apply babel in rspack mode when tools.babel not modify config

fix(builder): 在使用 rspack 构建时，如果 tools.babel 未实际修改配置时，则不使用 babel
