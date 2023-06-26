- **类型：** `Array<string | RegExp>`
- **默认值：** `[]`
- **打包工具：** `仅支持 webpack`

指定不需要编译的 JavaScript/TypeScript 文件。用法与 webpack 中的 [Rule.exclude](https://webpack.js.org/configuration/module/#ruleexclude) 一致，支持传入字符串或正则表达式来匹配模块的路径。


:::tip
在使用 Rspack 作为打包工具时，默认**所有文件**都会经过编译，同时，不支持通过 `source.exclude` 排除。
:::

比如:

```js
import path from 'path';

export default {
  source: {
    exclude: [path.resolve(__dirname, 'src/module-a'), /src\/module-b/],
  },
};
```
