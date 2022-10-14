---
'@modern-js/builder-webpack-provider': patch
---

fix(builder): not apply style-loader or extract css when target is node

fix(builder): 修复 CSS 构建时注册了 style-loader 或 extract css 导致报错的问题
