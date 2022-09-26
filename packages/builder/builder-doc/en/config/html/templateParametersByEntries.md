- Type: `Object`
- Default: `undefined`

Set different template parameters for different pages.

The usage is same as `templateParameters`, and you can use the "entry name" as the key to set each page individually.

`templateParametersByEntries` will overrides the value set in `templateParameters`.

#### Example

```js
export default {
  output: {
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
