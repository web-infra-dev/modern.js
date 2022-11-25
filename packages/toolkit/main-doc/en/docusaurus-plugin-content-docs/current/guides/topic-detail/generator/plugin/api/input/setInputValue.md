---
sidebar_position: 7
---

# setInputValue

Sets the input default value.

The method is available directly on the context.

Its type is defined as:

```ts
export interface IPluginContext {
    setInputValue: (value: Record<string, unknown>) => void;
  ...
}
```

## 示例

```ts
context.setInputValue({
  moduleRunWay: 'no',
});
```

:::warning
This method only supports setting the configuration parameter value corresponding to the project solution integrated by the generator plugin, and does not support setting the project solution type (solution) and project scene (scenes). These two configurations can be set by the `--config` parameter at execution default value.
:::
