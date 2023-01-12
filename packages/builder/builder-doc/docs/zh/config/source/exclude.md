- Type: `Array<string | RegExp>`
- Default: `[]`

指定不需要编译的 JavaScript/TypeScript 文件。用法与 webpack 中的 [Rule.exclude](https://webpack.js.org/configuration/module/#ruleexclude) 一致，支持传入字符串或正则表达式来匹配模块的路径。

比如:

```js
import path from 'path';

export default {
  source: {
    exclude: [path.resolve(__dirname, 'src/module-a'), /src\/module-b/],
  },
};
```
