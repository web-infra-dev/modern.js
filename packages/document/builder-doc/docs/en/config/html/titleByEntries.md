- **Type:** `Record<string, string>`
- **Default:** `undefined`

Set different title for different pages.

The usage is same as `title`, and you can use the "entry name" as the key to set each page individually.

`titleByEntries` will overrides the value set in `title`.

:::warning
**Deprecated**: This configuration is deprecated, please use the function usage of `title` instead.
:::

### Example

```js
export default {
  html: {
    title: 'ByteDance',
    titleByEntries: {
      foo: 'TikTok',
    },
  },
};
```

After recompiling, you can see:

- The title of the page `foo` is `TikTok`.
- The title of other pages is `ByteDance`.
