---
sidebar_position: 4
---

# Input

生成器插件提供了 Input 的方式完成与用户的问题交互，使用 JSON Schema 的方式进行定义：

例如：

```js
const schema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: '开发语言',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
};
```

JSON Schema 的格式参考了开源的 [Formily](https://formilyjs.org/) Schema 的格式，下面将对支持的字段进行介绍：

## type

定义当前 Schema 类型，当前支持的类型为 `string`、`number` 和 `object`。字符串输入和下拉选项都需要使用 `string` 类型。 `object` 类型用于实现 Schema 之间嵌套，需要配和 `properties` 属性使用。

## title

定义当前 Schema 展示名称。

## default

定义当前 Schema 的默认值。

## enum

当前 Schema 为下列选项时，定义选项内容。

子项支持 `string` 或者 `{ label: string; value: string}` 类型，当下拉选项中值和展示值相同时，可直接使用 `string` 定义。

当需要表示多选选项时，设置 `default` 字段为 `[]` 即可。

## x-validator

当前 Schema 的校验规则。当 Schema 为输入类型时，在输入完成后会自动完成校验。

这里校验规则支持[ Formily 提供的校验规则](https://formilyjs.org/zh-CN/guide/advanced/validate)，例如最大值为 5：

```js
const schema = {
  type: 'object',
  properties: {
    max_5: {
      type: 'number',
      title: '最大值(>5报错)',
      'x-validator': {
        maximum: 5,
      },
    },
  },
};
```

也支持直接使用验证函数：

```js
const schema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      title: '只能包含数字和字母',
      'x-validator': value => {
        if (!/^[0-9a-zA-Z]*$/g.test(value)) {
          return '格式不正确';
        }
        return '';
      },
    },
  },
};
```

## x-reactions

使用 Schema 之间的联动，这里和[ Formily 联动规则](https://formilyjs.org/zh-CN/guide/advanced/linkages)完全相同。

例如：

```js
const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: '名称',
    },
    path: {
      type: 'string',
      title: '路径',
      'x-reactions': [
        {
          dependencies: ['name'],
          fulfill: {
            state: {
              value: '{{$deps[0]}}',
            },
          },
        },
      ],
    },
  },
};
```

## properties

组织当前 Schema 的结构，定义子表单。`properties` 为对象，`key` 为 Schema 关键字，`value` 为上述描述的 Schema 对象。
