---
'@modern-js/runtime': patch
---

fix: should remove extensions for entry file in real entry file, cause developer may use [.server] for ssr bundle entry
fix: 需要移除入口文件的扩展名，因为开发者可能使用 [.server] 作为 ssr 产物的入口文件
