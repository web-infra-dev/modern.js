- Type: `Object | Function`
- Default:

```js
const defaultOptions = {
  postcssOptions: {
    plugins: [
      require('postcss-flexbugs-fixes'),
      require('postcss-custom-properties'),
      require('postcss-initial'),
      require('postcss-page-break'),
      require('postcss-font-variant'),
      require('postcss-media-minmax'),
      require('postcss-nesting'),
      require('autoprefixer')({
        flexbox: 'no-2009',
      }),
    ],
    // Depends on production environment, and whether `output.disableSourceMap` is set
    sourceMap: enableSourceMap
  },
};
```

Builder integrates PostCSS by default, you can configure [postcss-loader](https://github.com/webpack-contrib/postcss-loader) through `tools.postcss`.

### Type

#### Object

When this value is of type Object, it is merged with the default config via Object.assign. For example:

```js
export default {
  tools: {
    postcss: {
      // Because `Object.assign` is used, the default postcssOptions will be overwritten.
      postcssOptions: {
        plugins: [require('postcss-px-to-viewport')],
      },
    },
  },
};
```

#### Function

When the value is of type Function, the internal default config is passed as the first parameter, and the config object can be modified directly without returning, or an object can be returned as the final result; the second parameter is a set of tool functions for modifying the postcss-loader config.

For example, you need to add a PostCSS plugin on the basis of the original plugin, and push a new plugin to the postcssOptions.plugins array:

```ts
export default {
  tools: {
    postcss: opts => {
      opts.postcssOptions.plugins.push(require('postcss-px-to-viewport'));
    },
  },
};
```

When you need to pass parameters to the PostCSS plugin, you can pass them in by function parameters:

```js
export default {
  tools: {
    postcss: opts => {
      const viewportPlugin = require('postcss-px-to-viewport')({
        viewportWidth: 375,
      });
      opts.postcssOptions.plugins.push(viewportPlugin);
    },
  },
};
```

`tools.postcss` can return a config object and completely replace the default config:

```js

export default {
  tools: {
    postcss: () => {
      return {
        postcssOptions: {
          plugins: [require('postcss-px-to-viewport')],
        },
      };
    },
  },
};
```

### Util Functions

#### addPlugins

For adding additional PostCSS plugins.

```js
export default {
  tools: {
    postcss: (config, { addPlugins }) => {
      // Add a PostCSS Plugin
      addPlugins(require('postcss-preset-env'));
      // Add multiple PostCSS Plugins
      addPlugins([require('postcss-preset-env'), require('postcss-import')]);
    },
  },
};
```
