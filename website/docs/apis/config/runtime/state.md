---
sidebar_label: state
sidebar_position: 2
---

# runtime.state

:::info 适用的工程方案
* MWA
:::

- 类型：`boolean | object`
- 默认值：`false`

开启 `state` 后就可以使用 [Model](/docs/guides/features/runtime/model/model-introduction) 来做状态管理。


具体配置项如下：

## `immer`

- 类型：`boolean`
- 默认值：`true`

是否启用以 mutable 更新 state 的方式，默认启用，若想禁用则设置为 `false`。

## `effects`

- 类型：`boolean`
- 默认值：`true`

是否启用副作用管理特性，默认启用，若想禁用则设置为 `false`。

## `autoActions`

- 类型：`boolean`
- 默认值：`true`

是否启用自动生成 actions 特性，默认启用，若想禁用则设置为 `false`。


## `devtools`

- 类型：`boolean | EnhancerOptions`
- 默认值：`true`

是否启用 devtools，默认启用，同时支持 [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md) 的所有参数，若想禁用则设置为 `false`。
