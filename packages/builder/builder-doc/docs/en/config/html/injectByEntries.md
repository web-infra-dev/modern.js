- Type: `Record<string, boolean | string>`
- Default: `undefined`

Set different script tag inject positions for different pages.

The usage is same as `inject`, and you can use the "entry name" as the key to set each page individually.

`injectByEntries` will overrides the value set in `inject`.

#### Example

```js
export default {
  html: {
    inject: 'head',
    injectByEntries: {
      foo: 'body',
    },
  },
};
```

After recompiling, you will see:

- The script tag of the page `foo` will be injected inside the `body` tag.
- The script tag of other pages will be injected inside the `head` tag.
