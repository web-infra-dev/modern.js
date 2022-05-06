---
sidebar_label: transformer
sidebar_position: 1
---

# testing.transformer

:::info 适用的工程方案
* MWA
* 模块
:::

- 类型：`'babel-jest' | 'ts-jest'`
- 默认值：`babel-jest`

配置执行测试的时候对于源码的编译工具： [babel-jest](https://www.npmjs.com/package/babel-jest) 或 [ts-jest](https://github.com/kulshekhar/ts-jest)。默认使用 `babel-jest`。

:::info 补充信息
`babel-jest` 也可以编译 TS 文件，但不会类型报错，如果你需要跑测试的时候对 TS 类型进行校验，那么请使用 `ts-jest`。
:::

