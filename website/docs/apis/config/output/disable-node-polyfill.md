---
sidebar_label: disableNodePolyfill
---

# output.disableNodePolyfill

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean`
* 默认值： `false`

默认情况下我们内置了 [webpack 5 移除掉的 node polyfill](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed)。

如果确认项目下不需要任何 Node Polyfill，可以在 `modern.config.js` 中配置如下关闭内置引入的 Node Polyfill：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableNodePolyfill: true,
  },
});
```
