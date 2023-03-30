---
'@modern-js/builder-rspack-provider': patch
'@modern-js/babel-preset-base': patch
'@modern-js/utils': patch
---

fix: For rspack-provider can use `tools.babel` configuration, inline the `@babel/preset-typescript` to handle ts syntax in rspack-provider.
fix: 为了 rspack-provider 能给使用 `tools.babel` 配置项，将 `@babel/preset-typescript` 内置进 rspack-provider 去处理 ts 语法。
