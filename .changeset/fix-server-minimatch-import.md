---
'@modern-js/server': patch
---

fix(server): use the named minimatch export in the development watcher so native ESM imports work with minimatch 11.

fix(server)：开发服务器 watcher 改用 minimatch 的具名导出，修复升级 minimatch 11 后原生 ESM 加载失败的问题。
