---
sidebar_position: 5
---

# addOptionBefore

在特定问题的默认选项前 Options 选项。

该方法可直接在 context 上获取。

其类型定义为:

```ts
export interface IPluginContext {
    addOptionBefore: (key: string, optionKey: string, option: IOption) => void;
  ...
}
```

## key

问题关键字。
Modern.js 工程方案的配置的问题关键字，具体配置可查看[生成器配置](/docs/apis/generator/config/introduce)。

## optionKey

问题选项关键字。
Modern.js 工程方案的配置的问题选项关键字，具体配置可查看[生成器配置](/docs/apis/generator/config/introduce)。

## options

需要添加的选项，具体类型定义可查看[自定义输入相关类型定义](/docs/apis/generator/plugin/input/type)。

## 示例

```ts
context.addOptionBefore('packageManager', 'pnpm', {
    key: "npm",
    name: "NPM"
});
```

:::info
对于 Modern.js 工程类型提供的输入选项，暂时只支持删除，不支持增加，增加会造成代码中的逻辑判断存在问题。上方示例不可直接使用。
:::
