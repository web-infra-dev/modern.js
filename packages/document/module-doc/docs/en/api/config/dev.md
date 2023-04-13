---
sidebar_position: 3
---

# Dev Config

This section describes all configuration of Module Tools related to debugging tools.

``` ts
export default {
  dev: {
    storybook: {/* Storybook Config */},
  },
}
```

## storybook

**Requirements**:

- Turn on Storybook debugging or install the `@modern-js/plugin-storybook` plugin.
- Register the `@modern-js/plugin-storybook` plugin。

> For more information on how to enable Storybook debugging, please refer to：[【Storybook】](guide/basic/use-micro-generator#storybook)



### storybook.webpack

- **Type**: `Object` | `Function` | `undefined`

- **Default**: `undefined`

``` ts
export default {
  dev: {
    storybook: {
      webpack(config) {
        return config;
      },
    }
  }
}
```

You can modify the webpack configuration of the Storybook Preview-iframe via `dev.storybook.webpack`. The usage can be found in the [`tools.webpack`](https://modernjs.dev/builder/api/config-tools.html#tools.webpack) configuration of Modern.js Builder.

![Storybook](https://storybook.js.org/71522ac365feaf3338d7c242e53378f6/manager-preview.png)

:::tip
For the webpack configuration of the Storybook Manager app section, you can configure it by adding the `./config/storybook/main.js` file to configure it.

``` js
// ./config/storybook/main.js

module.exports = {
  // it controls the Storybook manager app
  managerWebpack: async (config, options) => {
    // update config here
    return config;
  },
};
```
:::

### storybook.webpackChain

- **Type**: `Function` | `undefined`

- **Default**: `undefined`

``` ts
export default {
  dev: {
    storybook: {
      webpackChain(chain) {
        return chain;
      },
    }
  }
}
```

You can modify the webpack configuration of the Storybook Preview-iframe via `dev.storybook.webpackChain`. You can refer to Modern.js Builder's [`tools.webpackChain`](https://modernjs.dev/builder/api/config-tools.html#tools.webpackchain) configuration for how to use it.

