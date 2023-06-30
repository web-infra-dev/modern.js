---
sidebar_position: 3
---

# dev

本章节描述了 Module Tools 关于调试工具相关的所有配置。

```ts
export default {
  dev: {
    storybook: {
      /* Storybook Config */
    },
  },
};
```

## storybook

**首先需要确保**：

- 开启 Storybook 调试功能或者安装 `@modern-js/plugin-storybook` 插件。
- 注册 `@modern-js/plugin-storybook` 插件。

> 关于如何开启 Storybook 调试功能，可以参考：[「Storybook 调试」](guide/basic/use-micro-generator#storybook-调试)

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

你可以通过 `dev.storybook.webpack` 来修改 Storybook Preview-iframe 的 webpack 配置。使用方式可以参考 Modern.js Builder 的 [`tools.webpack`](https://modernjs.dev/builder/api/config-tools.html#toolswebpack) 配置。

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

你可以通过 `dev.storybook.webpackChain` 来修改 Storybook Preview-iframe 的 webpack 配置。使用方式可以参考 Modern.js Builder 的 [`tools.webpackChain`](https://modernjs.dev/builder/api/config-tools.html#toolswebpackchain) 配置。
