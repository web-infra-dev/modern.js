- Type: `Record<string, Record<string, unknown>>`
- Default:

```ts
type DefaultParameters = {
  meta: string; // corresponding to html.meta config
  title: string; // corresponding to html.title config
  mountId: string; // corresponding to html.mountId config
  entryName: string; // entry name
  assetPrefix: string; // corresponding to output.assetPrefix config
  compilation: webpack.Compilation; // Compilation object corresponding to webpack
  webpackConfig: config; // webpack config
  // htmlWebpackPlugin built-in parameters
  // See https://github.com/jantimon/html-webpack-plugin for details
  htmlWebpackPlugin: {
    tags: object;
    files: object;
    options: object;
  };
};
```

Define the parameters in the HTML template, corresponding to the `templateParameters` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).

#### Example

To use the `foo` parameter in the HTML template, you can add the following config:

```js
export default {
  html: {
    templateParameters: {
      foo: 'bar',
    },
  },
};
```

In the HTML template, read the parameter via `<%= foo %>`:

```js
<script>window.foo = '<%= foo %>'</script>
```

The compiled HTML is:

```js
<script>window.foo = 'bar'</script>
```
