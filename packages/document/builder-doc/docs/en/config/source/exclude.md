- **Type:** `Array<string | RegExp>`
- **Default:** `[]`
- **Bundler:** `only support webpack`

Specifies JavaScript/TypeScript files that do not need to be compiled. The usage is consistent with [Rule.exclude](https://webpack.js.org/configuration/module/#ruleexclude) in webpack, which supports passing in strings or regular expressions to match the module path.

:::tip
When using Rspack as the bundler,  **all files** will be compiled by default, and at the same time, exclusion through `source.exclude` is not supported.
:::

For example:

```js
import path from 'path';

export default {
  source: {
    exclude: [path.resolve(__dirname, 'src/module-a'), /src\/module-b/],
  },
};
```
