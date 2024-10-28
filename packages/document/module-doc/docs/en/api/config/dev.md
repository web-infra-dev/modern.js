---
sidebar_position: 3
---

# dev

This section describes all configuration of Modern.js Module related to debugging tools.

## storybook

:::warning
**Deprecated**: This configuration is deprecated and only applicable to Storybook V6. Please see [使用 Storybook](/guide/basic/using-storybook) to get more info.
:::

### storybook.webpack

- **Type**: `object | Function | undefined`
- **Default**: `undefined`

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

#### Configure Manager App

For the webpack configuration of the Storybook Manager app section, you can configure it by adding the `./config/storybook/main.js` file to configure it.

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

- **Type**: `Function | undefined`
- **Default**: `undefined`

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
