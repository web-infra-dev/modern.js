---
'@modern-js/app-tools': patch
'@modern-js/prod-server': patch
---

fix(app-tools): failed to emit modern.config.json when distPath.root is absolute path

fix(app-tools): 修复 distPath.root 为绝对路径时无法输出 modern.config.json 的问题
