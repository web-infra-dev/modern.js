---
sidebar_position: 4
---

# Input

Generator plugin provides a way to interact with users through Input, which is defined using JSON Schema:

For example:

```js
const schema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: 'Please select the programming language:',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
};
```

JSON Schema format is based on the open source [Formily](https://formilyjs.org/) Schema format. The following are the supported fields:

## type

Defines the type of the current schema. Currently supported types are `string`, `number`, and `object`. `string` type is used for string inputs and dropdown options. `object` type is used for nesting schemas and needs to be used with the `properties` attribute.

## title

Defines the display name of the current schema.

## default

Defines the default value of the current schema.

## enum

Defines the options when the current schema is a dropdown selection.

The sub-items support `string` or `{ label: string; value: string}` types. When the value and display value are the same in the dropdown options, `string` can be used directly to define the options.

When representing multiple selection options, set the `default` field to `[]`.

## x-validator

Defines the validation rules for the current schema. When the schema is an input type, validation will be automatically performed after input completion.

The validation rules supported here are provided by [Formily](https://formilyjs.org/zh-CN/guide/advanced/validate), for example, the maximum value is 5:

```js
const schema = {
  type: 'object',
  properties: {
    max_5: {
      type: 'number',
      title: 'Maximum value (>5 will cause an error)',
      'x-validator': {
        maximum: 5,
      },
    },
  },
};
```

It also supports using validation functions directly:

```js
const schema = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      title: 'Can only contain numbers and letters',
      'x-validator': value => {
        if (!/^[0-9a-zA-Z]*$/g.test(value)) {
          return 'Incorrect format';
        }
        return '';
      },
    },
  },
};
```

## x-reactions

Use linkage between schemas. This is exactly the same as [Formily linkage rules](https://formilyjs.org/zh-CN/guide/advanced/linkages).

For example:

```js
const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: 'Name',
    },
    path: {
      type: 'string',
      title: 'Path',
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

Organize the structure of the current schema and define sub-forms. `properties` is an object, where the `key` is the schema keyword and the `value` is a schema object as described above.
