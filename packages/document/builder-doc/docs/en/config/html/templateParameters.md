- **Type:** `Object | Function`
- **Default:**

```ts
type DefaultParameters = {
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

Define the parameters in the HTML template, corresponding to the `templateParameters` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin). You can use the config as an object or a function.

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
    templateParameters(defaultValue, { entryName }) {
      const params = {
        foo: {
          ...defaultValue,
          type: 'Foo',
        },
        bar: {
          ...defaultValue,
          type: 'Bar',
          hello: 'world',
        },
      };
      return params[entryName] || defaultValue;
    },
  },
};
```

For detailed usage, please refer to [Rsbuild - html.templateParameters](https://rsbuild.dev/config/html/template-parameters).
