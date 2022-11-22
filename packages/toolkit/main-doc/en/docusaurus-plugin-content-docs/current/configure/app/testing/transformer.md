---
title: testing.transformer
sidebar_label: transformer
sidebar_position: 1
---

- Type: `'babel-jest' | 'ts-jest'`
- Default: `babel-jest`

Configure the compiler for source code when executing tests: [babel-jest](https://www.npmjs.com/package/babel-jest) or [ts-jest](https://github.com/kulshekhar/ts-jest). `babel-jest` is used by default.

:::info Additional information
`Babel-jest` can also compile TS files, but there is no type error. If you need to check the TS type when running tests, then use `ts-jest`.
:::
