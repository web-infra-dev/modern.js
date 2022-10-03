- Type: `string`
- Default:

Define the path to the HTML template, corresponding to the `template` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).

#### Example

Replace the default template with a custom HTML template file，you can add the following config:

```js
export default {
  html: {
    template: './static/index.html',
  },
};
```
