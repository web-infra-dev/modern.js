---
sidebar_position: 5
---

# Testing

本章描述了测试相关的配置
:::tips
需要先通过 `pnpm run new` 启用 单元测试 功能。
:::

## jest

- 类型： `Object | Function`
- 默认值：`{}`

对应 [Jest](https://jestjs.io/docs/configuration) 的配置，当为 `Object` 类型时，可以配置 Jest 所支持的所有底层配置 。

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    jest: {
      testTimeout: 10000,
    },
  },
});
```

值为 `Function` 类型时，默认配置作为第一个参数传入，需要返回新的 Jest 配置对象。

```js modern.config.ts
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    jest: options => {
      return {
        ...options,
        testTimeout: 10000,
      };
    },
  },
});
```

## transformer

- 类型：`'babel-jest' | 'ts-jest'`
- 默认值：`'babel-jest'`

配置执行测试的时候对于源码的编译工具： [babel-jest](https://www.npmjs.com/package/babel-jest) 或 [ts-jest](https://github.com/kulshekhar/ts-jest)。默认使用 `babel-jest`。

:::info
`babel-jest` 也可以编译 TS 文件，但不会类型报错，如果你需要跑测试的时候对 TS 类型进行校验，那么请使用 `ts-jest`。
:::
