# Features

## How to import UI Component library on demand?

If you need to configure the on-demand import of component libraries, you can configure [babel-plugin-import](https://github.com/ through [tools.babel](/en/api/config-tools.html#tools-babel) umijs/babel-plugin-import) plugin.

```ts
export default {
  tools: {
    babel: (config, { addPlugins }) => {
      addPlugins([
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ]);
    },
  },
};
```

## How to run ESLint during compilation?

For the sake of compilation performance, Builder will not perform ESLint verification during the compilation process by default. If you need this function, you can manually install and register the [eslint-webpack-plugin](https://github.com/webpack) in the community -contrib/eslint-webpack-plugin).

The sample code to register the plugin is as follows:

```js
import ESLintPlugin from 'eslint-webpack-plugin';

export default {
  tools: {
    webpackChain(chain) {
      chain.plugin('eslint-plugin').use(ESLintPlugin, [
        {
          extensions: ['.js', '.ts', '.jsx', 'tsx', '.mjs'],
        },
      ]);
    },
  },
};
```

> For more detailed usage, please refer to the [eslint-webpack-plugin](https://github.com/webpack-contrib/eslint-webpack-plugin) documentation.

## How to configure CDN path for static assets?

If you need to upload static assets such as JS and CSS to CDN for use, you can set the URL prefix of static assets through the [output.assetPrefix](/api/config-output.html#outputassetprefix) configuration.

```js
export default {
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
};
```

## How to clear the webpack cache?

By default, Builder's webpack cache is generated in the `./node_modules/.cache/webpack` directory.

If you need to clear the local webpack cache, you can execute the following command:

```bash
rm -rf ./node_modules/.cache
```

## How to remove console after production build?

When the production environment is built, we can remove the `console` from the code, so as to avoid the log of the development environment being output to the production environment.

Builder provides a configuration item to remove console by default, please see [performance.removeConsole](/en/api/config-performance.html#performance-removeconsole).
