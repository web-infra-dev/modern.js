- Type: `Record<string, Meta>`
- Default: `undefined`

Set different meta tags for different pages.

The usage is same as `meta`, and you can use the "entry name" as the key to set each page individually.

`metaByEntries` will overrides the value set in `meta`.

#### Example

```js
export default {
  html: {
    meta: {
      description: 'ByteDance',
    },
    metaByEntries: {
      foo: {
        description: 'Tiktok',
      },
    },
  },
};
```

After compiling, you can see that the meta of the page `foo` is:

```html
<meta name="description" content="Tiktok" />
```

The meta of other pages is:

```html
<meta name="description" content="ByteDance" />
```
