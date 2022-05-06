---
sidebar_label: cssModuleLocalIdentName
---

# output.cssModuleLocalIdentName

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `[name]__[local]--[hash:base64:5]`

设置 CSS Modules 生成的 local ident name：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    cssModuleLocalIdentName: '[path][name]__[local]',
  },
});
```

更多配置与解释参考：[css-loader#localIdentName](https://github.com/webpack-contrib/css-loader#localidentname)。

:::info 注
使用 [babel-plugin-react-css-modules](https://github.com/gajus/babel-plugin-react-css-modules) 时，该插件的配置选项 `generateScopedName` 需要和 `output.cssModuleLocalIdentName` 保持一致。
:::
