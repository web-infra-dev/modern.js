- **Type:** `string | Function`
- **Default:**

Define the path to the HTML template, corresponding to the `template` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).

### Example

Replace the default template with a custom HTML template file, you can add the following config:

```js
export default {
  html: {
    template: './static/index.html',
  },
};
```

For detailed usage, please refer to [Rsbuild - html.template](https://rsbuild.dev/config/html/template).
