# @e2e/garfish

This folder contains the e2e test cases of Modern.js framework with Garfish.

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

# Run specific test case, such as "dashboard"
pnpm run test:webpack dashboard
pnpm run test:rspack dashboard
```
