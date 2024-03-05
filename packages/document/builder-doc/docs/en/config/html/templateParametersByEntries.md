- **Type:** `Object`
- **Default:** `undefined`

Set different template parameters for different pages.

The usage is same as `templateParameters`, and you can use the "entry name" as the key to set each page individually.

`templateParametersByEntries` will overrides the value set in `templateParameters`.

:::warning
**Deprecated**: This configuration is deprecated, please use the function usage of `templateParameters` instead.
:::

### Example

```js
export default {
  html: {
    templateParametersByEntries: {
      foo: {
        type: 'a',
      },
      bar: {
        type: 'b',
      },
    },
  },
};
```
