---
sidebar_position: 2
---

# addInputBefore

在默认输入前添加输入问题。

该方法可直接在 context 上获取。

其类型定义为：

```ts
export interface IPluginContext {
  addInputBefore: (key: string, input: IInput) => void;
  ...
}
```

## key

Modern.js 工程方案的配置的问题关键字，具体配置可查看[生成器配置](/docs/apis/generator/config/introduce)。

## input

需要添加的问题，具体类型定义可查看[自定义输入相关类型定义](/docs/apis/generator/plugin/input/type)。

## 示例

在包管理工具后面添加输入：

```ts
context.addInputBefore('packageManager', {
    key: 'test',
    name: '测试输入',
    type: 'input'
})
```

:::info
注意事项

1. 添加问题的 key 不能和 Modern.js 提供的项目类型自身的问题的 key 重复

2. 添加问题 `addInputAfter` 的优先级高于 `addInputBefore`，当同时对一个 `key` 添加 After 问题和对其后一个key 添加 Before 问题时，After 问题会在 Before 之前。

3. 当需要在相同 `key` 前面或者后面添加多个问题时，可多次调用该方法，问题的顺序会按照调用顺序进行排列。
:::
