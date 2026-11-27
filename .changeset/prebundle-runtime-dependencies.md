---
'@modern-js/utils': minor
'@modern-js/server-core': patch
---

Add `@modern-js/utils/glob/v14` for promise-based glob matching. Existing glob exports retain their v3 callbacks and events. Refresh the prebundled dependencies and load server environment files quietly with dotenv 17 and dotenv-expand 11.

新增 `@modern-js/utils/glob/v14`，支持基于 Promise 的文件匹配。现有 glob 入口继续支持 v3 的回调和事件。更新内置依赖，服务端通过 dotenv 17 和 dotenv-expand 11 静默加载环境文件。
