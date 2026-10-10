---
'@modern-js/plugin-i18n': patch
---

fix(i18n): use named router imports and return only the required react-i18next exports to allow unused dependency code to be tree-shaken.

fix(i18n): 使用 Router 命名导入，并仅返回所需的 react-i18next 导出，便于构建器裁剪未使用的依赖代码。
