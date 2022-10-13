---
sidebar_position: 4
---

# setInput

设置问题属性。

该方法可直接在 context 上获取。

其类型定义为：

```ts
export interface IPluginContext {
  setInput: (key: string, field: string, value: unknown) => void;
  ...
}
```

## key

问题关键字，可以为 Modern.js 工程方案的问题关键字，也可以为生成器插件中新增问题的关键字。

## filed

需设置的问题字段，可修改除了当前 Input 除 key 以外的其他字段，Input 具体类型定义可查看[自定义输入相关类型定义](/docs/apis/generator/plugin/input/type)。

## value

需设置的问题字段值。value 支持函数，函数参数为当前字段值，返回值需要为完整的新的字段值。

:::info
对于 Modern.js 工程类型提供的输入选项，暂时只支持删除，不支持增加，增加会造成代码中的逻辑判断存在问题。
:::

## 示例

修改 packageName 的展示名称

```ts
context.setInput('packageName', 'name', "展示名称");
```
