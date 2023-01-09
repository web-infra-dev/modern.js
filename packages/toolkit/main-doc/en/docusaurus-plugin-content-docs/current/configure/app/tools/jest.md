---
title: tools.jest

sidebar_label: jest
---

- Type: `Object | Function`
- Default: `{}`

:::caution Caution
First you need to enable the "Unit Test" function using [new](/docs/apis/app/commands/new) command.
:::

Corresponding to the configuration of [Jest](https://jestjs.io/docs/configuration), when of type `Object`, all underlying configurations supported by Jest can be configured.

```js title=modern.config.js
export default defineConfig({
  tools: {
    jest: {
      testTimeout: 10000,
    },
  },
});
```

When the value is of type `Function`, the default configuration is passed in as the first parameter and a new Jest configuration object needs to be returned.

```js title=modern.config.js
export default defineConfig({
  tools: {
    jest: options => {
      return {
        ...options,
        testTimeout: 10000,
      };
    },
  },
});
```
