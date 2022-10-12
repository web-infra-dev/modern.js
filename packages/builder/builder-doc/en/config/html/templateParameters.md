- Type: `Object | Function`
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

Define the parameters in the HTML template, corresponding to the `templateParameters` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).You can use the config as an object or a function.

If it is an object, it will be merged with the default parameters. For example:

```ts
export default {
  html: {
    templateParameters: {
      title: 'My App',
    },
  },
};
```

If it is a function, the default parameters will be passed in, and you can return an object to override the default parameters. For example:

```ts
export default {
  html: {
    templateParameters: (defaultParameters) => {
      console.log(defaultParameters.compilation);
      console.log(defaultParameters.title);
      return {
        title: 'My App',
      };
    },
  },
};
```

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

Or you can use a function to dynamically generate the parameters:

```js
export default {
  html: {
    templateParameters: (defaultParameters) => {
      return {
        foo: 'bar',
      };
    },
  },
};
```

Then you can use the `foo` parameter in the HTML template by `<%= foo %>`:

```html
<script>window.foo = '<%= foo %>'</script>
```

The compiled HTML is:

```js
<script>window.foo = 'bar'</script>
```
