---
'@modern-js/builder-plugin-swc': patch
'@modern-js/babel-preset-app': patch
'@modern-js/utils': patch
---

refactor: Substract getCorejsVersion to the util package, so that swc plugin can reuse it.
refactor: 将 getCorejsVersion 提取到 util 包，让 swc 插件可以复用其逻辑
