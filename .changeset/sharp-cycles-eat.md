---
'@modern-js/uni-builder': patch
'@modern-js/render': patch
'@modern-js/types': patch
'@modern-js/utils': patch
---

fix(render): fork react-server-dom-webpack to avoid warnings about installing dependencies
fix(render): 内置 react-server-dom-webpack 到 packages/toolkit/utils/compiled 中，避免安装依赖的警告
