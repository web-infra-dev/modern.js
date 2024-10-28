---
sidebar_position: 3
---

# dev

本章节描述了 Modern.js Module 关于调试工具相关的所有配置。

## storybook

:::warning
**Deprecated**：该配置已过时，只适用于 Storybook V6，详情请看[使用 Storybook](/guide/basic/using-storybook)。
:::

### storybook.webpack

- 类型：`object | Function | undefined`
- 默认值：`undefined`

```ts
export default {
  dev: {
    storybook: {
      webpack(config) {
        return config;
      },
    },
  },
};
```

![Storybook](https://storybook.js.org/71522ac365feaf3338d7c242e53378f6/manager-preview.png)

#### 配置 Manager App

对于 Storybook Manager App 部分的 webpack 配置，可以通过增加 `./config/storybook/main.js` 文件进行配置。

```js
// ./config/storybook/main.js

module.exports = {
  // it controls the Storybook manager app
  managerWebpack: async (config, options) => {
    // update config here
    return config;
  },
};
```

### storybook.webpackChain

- 类型：`Function | undefined`
- 默认值：`undefined`

```ts
export default {
  dev: {
    storybook: {
      webpackChain(chain) {
        return chain;
      },
    },
  },
};
```
