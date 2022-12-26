---
sidebar_position: 10
title: Testing
---

Modern.js inherits the testing capabilities of [Jest](https://jestjs.io/) by default.

First need to execute `pnpm run new` enable [unit test/integration test] features：

```
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「单元测试 / 集成测试」功能
```

After executing the above command, the `"test": "modern test"` command will be automatically generated in package.json.

register plugin in `modern.config.ts`:

```ts title="modern.config.ts"
import TestPlugin from '@modern-js/plugin-testing';
// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  ...,
  plugins: [..., TestPlugin()],
});
```

## Test file

Modern.js default recognized test file paths are: `<rootDir>/src/**/*.test.[jt]s?(x)` and `<rootDir>/tests/**/*.test.[jt]s?(x)`。

If you need to customize the test directory, you can configure it with [tools.jest](/docs/configure/app/tools/jest).

## Usage

Modern.js test support [testing-library](https://testing-library.com/docs/). API can be imported from `@modern-js/runtime/testing`.

```
import { render, screen } from '@modern-js/runtime/testing';
```

Other Modern.js supported testing APIs can be found [here](/docs/apis/app/runtime/testing/cleanup)。

## transform

Modern.js tests use [babel-jest](https://www.npmjs.com/package/babel-jest) for source code compilation by default. If you need to use [ts-jest](https://github.com/kulshekhar/ts-jest), you can configure it through [testing.transform](/docs/configure/app/testing/transformer).
