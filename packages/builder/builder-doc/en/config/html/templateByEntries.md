- Type: `Object`
- Default: `undefined`

Set different template file for different pages.

The usage is same as `template`, and you can use the "entry name" as the key to set each page individually.

`templateByEntries` will overrides the value set in `template`.

#### Example

```js
export default {
  output: {
    template: './static/index.html',
    templateByEntries: {
      foo: './src/pages/foo/index.html',
      bar: './src/pages/bar/index.html',
    },
  },
};
```
