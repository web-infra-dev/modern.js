- Type: `string`
- Default: `'root'`

By default, the `root` element is included in the HTML template for component mounting, and the element id can be modified through `mountId`.

```html
<body>
  <div id="root"></div>
</body>
```

#### Example

Set the `id` to `app`:

```js
export default {
  html: {
    mountId: 'app',
  },
};
```

After compilation:

```html
<body>
  <div id="app"></div>
</body>
```

:::tip
If you customized the HTML template, please make sure that the template contains `<div id="<%= mountId %>"></div>`, otherwise this config will not take effect.
:::
