---
'@modern-js/builder-webpack-provider': patch
'@modern-js/builder-rspack-provider': patch
'@modern-js/builder-shared': patch
---

fix(builder): failed to minify css when use style-loader in Rspack

fix(builder): 修复使用 Rspack + style-loader 时未压缩 CSS 的问题
