- **Type:** `string`
- **Default:** `'root'`

By default, the `root` element is included in the HTML template for component mounting, and the element id can be modified through `mountId`.

```html
<body>
  <div id="root"></div>
</body>
```

### Example

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

### Notes

#### Update Relevant Code

After modifying `mountId`, if there is logic in your code to obtain the `root` root node, please update the corresponding value:

```diff
- const domNode = document.getElementById('root');
+ const domNode = document.getElementById('app');

ReactDOM.createRoot(domNode).render(<App />);
```

#### Custom Templates

If you customized the HTML template, please make sure that the template contains `<div id="<%= mountId %>"></div>`, otherwise the `mountId` config will not take effect.
