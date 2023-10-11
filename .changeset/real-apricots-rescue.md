---
'@modern-js/module-tools': patch
---

fix: change the output css module json filename when bundleless, eg, when you have a input which called 'index.module.css', builder will generate 'index_module_css.js' and 'index_module.css', it will avoid naming conflicts.
fix:  bundleless 时修改生成的 css module json 文件名，例如当你有一个入口文件叫做 'index.module.css'，构建器会生成 'index_module_css.js' 和 'index_module.css' 两个文件，此操作可以避免命名冲突。
