- Type: `Record<string, string>`
- Default: `undefined`

Set different favicon for different pages.

The usage is same as `favicon`, and you can use the "entry name" as the key to set each page individually.

`faviconByEntries` will overrides the value set in `favicon`.

#### Example

```js
export default {
  html: {
    favicon: './src/assets/default.png',
    faviconByEntries: {
      foo: './src/assets/foo.png',
    },
  },
};
```

After recompiling, you will see:

- The favicon for page `foo` is `./src/assets/foo.png`.
- The favicon for other pages is `./src/assets/default.png`.
