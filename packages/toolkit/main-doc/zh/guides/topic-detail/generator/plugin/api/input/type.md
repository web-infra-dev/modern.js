---
sidebar_position: 1
---

# 自定义输入相关类型定义

## Input

Modern.js Input 输入类型采用了开源的 [Formily](https://formilyjs.org/) Schema 结果，支持了部分其 Schema 字段。

### type

schema 类型，目前生成器插件输入支持的类型为 `string`、`number` 和 `object` 类型。其中 `object` 用于实现 schema 嵌套，需要和 `properties` 配合使用。

### name

schema 的关键字。

### title

schema 的展示名称。

### default

schema 默认值。

### enum

schema 如果为选择类型，该字段用于定义选项内容。

每个选项支持两个字段：

- value: 选项值。

- label: 展示名称。

### x-validate

schema 的验证规则。这里支持 Formily 的校验方式，具体可参考 [Formily 表单校验](https://formilyjs.org/zh-CN/guide/advanced/validate)。

### x-reactions

schema 字段联动。这里支持 Formily 的联动方式，具体可参考 [Formily 实现联动逻辑](https://formilyjs.org/zh-CN/guide/advanced/linkages)。

### properties

当 schema 类型为 `object` 时，定义其子表单。

## 示例

```typescript
const schema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: i18n.t(localeKeys.plugin_type.self),
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
};
```
