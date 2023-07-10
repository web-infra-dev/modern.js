# @e2e/builder

This folder contains the e2e test cases of Modern.js Builder.

## Tech Stack

- [playwright](https://github.com/microsoft/playwright): The e2e test framework.
- [@modern-js/e2e](../../../packages/toolkit/e2e): Provide utils for e2e test.

## Commands

```bash
# Run all test cases, including Rspack and Webpack
pnpm run test

# Run test cases for Rspack
pnpm run test:rspack

# Run test cases for Webpack
pnpm run test:webpack

# Run specific test case, such as "css"
pnpm run test:webpack css
pnpm run test:rspack css
```

## Add Test Cases

### Add test cases for common capabilities

Test cases added using the `test` method will run in webpack and Rspack.

```ts
import { expect, test } from '@modern-js/e2e/playwright';
// will passed in webpack, and rspack
test('test 1 + 1', () => {
    expect(1 + 1).toBe(2);
})
```

If the capability corresponding to the test case is not yet supported in other bundlers,
you can use the `webpackOnlyTest` or `rspackOnlyTest` methods for testing. Once other bundlers also support it, you can replace it with the `test` method.

```ts
import { webpackOnlyTest } from '@scripts/helper';
// will passed in webpack, and skipped in rspack
webpackOnlyTest('test 1 + 1', () => {
    expect(1 + 1).toBe(2);
})
```

### Add test cases for a bundler's unique capability

If you want to add test cases for a bundler's unique capability and do not need to be supported by other bundlers, such as `tools.webpack` or `tools.webpackChain`, you can add the infix `.webpack` or `.rspack` to the file name, for example, `index.webpack.test.ts`.
