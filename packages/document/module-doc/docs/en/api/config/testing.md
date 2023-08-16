---
sidebar_position: 5
---

# testing

This chapter describes the test-related configuration

:::tip
You need to enable the unit testing feature with `pnpm run new` first.
:::

## jest

- Type: `object | Function`
- Default: `{}`

The configuration corresponding to [Jest](https://jestjs.io/docs/configuration), when of type `object`, can be configured with all the underlying configurations supported by Jest .

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    jest: {
      testTimeout: 10000,
    },
  },
});
```

When the value is of type `Function`, the default configuration is passed as the first parameter and a new Jest configuration object needs to be returned.

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    jest: options => {
      return {
        ... . options,
        testTimeout: 10000
      }
    }
  }
});
```

## transformer

- Type: `'babel-jest' | 'ts-jest'`
- Default: `'babel-jest'`

Configure the compilation tool for the source code when executing tests: [babel-jest](https://www.npmjs.com/package/babel-jest) or [ts-jest](https://github.com/kulshekhar/ts-jest). The default is `babel-jest`.

:::info
`babel-jest` can also compile TS files without type errors, so use `ts-jest` if you need to check the TS type when running tests.
:::
