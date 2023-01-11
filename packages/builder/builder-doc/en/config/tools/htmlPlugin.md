- Type: `false | Object | Function`
- Default:

```js
const defaultHtmlPluginOptions = {
  inject, // corresponding to the html.inject config
  favicon, // corresponding to html.favicon config
  filename, // generated based on output.distPath and entryName
  template, // defaults to the built-in HTML template path
  templateParameters, // corresponding to the html.templateParameters config
  chunks: [entryName],
  minify: {
    removeComments: false,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  },
};
```

The configs of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) can be modified through `tools.htmlPlugin`.

### Object Type

When `tools.htmlPlugin` is `Object` type, the value will be merged with the default config via `Object.assign`.

```js
export default {
  tools: {
    htmlPlugin: {
      scriptLoading: 'blocking',
    },
  },
};
```

### Function Type

When `tools.htmlPlugin` is a Function:

- The first parameter is the default config, which can be modified directly.
- The second parameter is also an object, containing the entry name and the entry value.
- The Function can return a new object as the final config.

```js
export default {
  tools: {
    htmlPlugin(config, { entryName, entryValue }) {
      if (entryName === 'main') {
        config.scriptLoading = 'blocking';
      }
    },
  },
};
```

### Boolean Type

The built-in `html-webpack-plugin` plugins can be disabled by set `tools.htmlPlugin` to `false`.

```js
export default {
  tools: {
    htmlPlugin: false,
  },
};
```
