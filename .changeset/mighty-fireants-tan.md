---
'@modern-js/module-tools': patch
---

fix(module-tools): When dealing with dts file alias, explicitly declare the extension when calling matchPath to avoid the problem of not being able to find the module.
fix(module-tools): 处理类型描述文件别名过程中，在调用 matchPath 时显式声明后缀名，避免无法找到模块的问题
