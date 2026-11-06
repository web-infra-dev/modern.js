---
'@modern-js/app-tools': patch
---

fix(app-tools): use a regular expression for watch ignores so node_modules and .git are ignored while generated files remain watched.

fix(app-tools)：将文件监听的忽略规则改为正则表达式，正确忽略 node_modules 和 .git，同时保留对生成文件的监听。
