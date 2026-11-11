---
'@modern-js/app-tools': patch
---

fix(app-tools): keep watching a custom output.tempDir inside node_modules and keep the watch ignore in array form so Module Federation does not replace it.

fix(app-tools): 自定义的 output.tempDir 在 node_modules 下时也保持监听，监听忽略规则保持数组形式，避免被 Module Federation 插件替换。
