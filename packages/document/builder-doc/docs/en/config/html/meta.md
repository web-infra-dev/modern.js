- **Type:** `Object | Function`
- **Default:** `undefined`

Configure the `<meta>` tag of the HTML.

### Example

When the `value` of a `meta` object is a string, the `key` of the object is automatically mapped to `name`, and the `value` is mapped to `content`.

For example to set description:

```js
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

The generated `meta` tag in HTML is:

```html
<meta name="description" content="a description of the page" />
```

For detailed usage, please refer to [Rsbuild - html.meta](https://rsbuild.dev/config/html/meta).
