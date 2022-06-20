---
sidebar_label: speedy
---

# tools.babel

:::info 适用的工程方案
* 模块
:::

- 类型： `Object | Function`
- 默认值：`undefined`

通过 `tools.speedy` 可以修改 [speedy](https://github.com/speedy-js/speedystack) 的配置项。

## 类型

值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

```js title="modern.config.js"
import myPlugin from './myPlugin';
export default defineConfig({
  tools: {
    speedy: {
      plugins: [myPlugin()],
    },
  },
});
```

值为 `Function` 类型时，内部配置（取决于你的modern config）作为参数传入，然后返回最终配置

```js title="modern.config.js"
export default defineConfig({
  tools: {
    speedy: config => ({
      ...config,
      cache: {
        transform: false,
      },
    }),
  },
});
```
