---
sidebar_position: 4
---

# setInput

Set the problem attribute.

The method is available directly on the context.

Its type is defined as:

```ts
export interface IPluginContext {
  setInput: (key: string, field: string, value: unknown) => void;
  ...
}
```

## key

The problem keyword can be the problem keyword of the Modern.js project solution, or the keyword of the new problem in the generator plugin.

## filed

he problem field to be set, you can modify other fields except the key of the current Input, Input specific type definition viewable [Customize input related type definition](/docs/guides/topic-detail/generator/plugin/api/input/type).

## value

The value of the problem field to be setted. value supports function, the function parameter is the current field value, and the return value needs to be the complete new field value.

:::info
For the input options provided by the Modern.js project type, only delete is temporarily supported, and increase is not supported. The increase will cause problems in the logical judgment in the code.
:::

## Example

Modify the display name of `packageName`:

```ts
context.setInput('packageName', 'title', 'Show title');
```
