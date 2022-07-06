---
'@modern-js/webpack': patch
---

fix(webpack): should not inject CSS sourcemap in js bundles

fix(webpack): 修复使用 style-loader 时会将 CSS 的 SourceMap 打包到 JS 中的问题
