---
sidebar_position: 3
---

# addInputAfter

Add input question after default input.

The method is available directly on the context.

Its type is defined as:

```ts
export interface IPluginContext {
  addInputAfter: (key: string, input: Schema) => void;
  ...
}
```

## key

Modern.js the problem keyword of the configuration of the engineering solution, the specific configuration viewable [Generator Configuration](/docs/guides/topic-detail/generator/config/common).

## input

Questions that need to be added, specific type definition viewable [Customize input related type definition](/docs/guides/topic-detail/generator/plugin/api/input/type).


## Example

Add input after package management tool:

```ts
context.addInputAfter('packageManager', {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: 'Develop Language',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
})
```

:::info Notes
1. The key of the added question cannot be duplicated with the key of the question of the item type itself provided by the Modern.js.


2. The priority of adding the problem `addInputAfter` is higher than `addInputBefore`. When adding After problem to one `key` and Before problem to the next key at the same time, After problem will be before Before.


3. When multiple questions need to be added before or after the same `key`, the method can be called multiple times, and the order of questions will be permutated in the order in which they are called.
:::
