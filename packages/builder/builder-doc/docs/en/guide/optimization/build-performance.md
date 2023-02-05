# Improve Build Performance

Modern.js Builder optimizes build performance by default, but as the project becomes larger, you may encounter some build performance problems.

This document provides some optional speed-up strategies, developers can choose some of them to improve the build performance.

:::tip 📢 Notice
The strategies in [Bundle Size Optimization](/en/guide/optimization/optimize-bundle.html) can also be used to improve build performance, so we won't repeat them here.
:::

## General optimization strategy

The following are some general optimization strategies, which can speed up the development build and production build, and some of them also optimize the bundle size.

### Upgrade Node.js version

In general, updating Node.js to the latest [LTS release](https://github.com/nodejs/release#release-schedule) will help improve build performance.

Especially for devices with Apple M1/M2 chips, it is recommended to use Node 16 or Node 18.

Node 16 provides Apple Silicon binaries by default, so the performance on M1/M2 models will be greatly improved than Node 14. According to our tests, **After switching from Node 14 to Node 16, the compilation speed can be improved by more than 100%**.

You can switch to Node 16 by following steps:

```bash
# Install Node.js v16
nvm install 16

# switch to Node 16
nvm use 16

# Set Node 16 as the default version
nvm default 16

# View Node version
node -v
```

### Using SWC or esbuild

[SWC](https://SWC.rs/) (Speedy Web Compiler) is a transformer and minimizer for JavaScript and TypeScript based on `Rust`. SWC can provide the same abilities with Babel, and it's more than 10x faster than Babel.

[esbuild](https://esbuild.github.io/) is a front-end build tool based on Golang. It has the functions of bundling, compiling and minimizing JavaScript code. Compared with traditional tools, the performance is significantly improved. When minimizing code, compared to webpack's built-in terser minimizer, esbuild has dozens of times better performance.

Builder provides SWC plugin and esbuild plugin that allow you to use SWC or esbuild instead of babel-loader, ts-loader and terser for transformation and minification process. See:

- [SWC plugin document](/plugins/plugin-swc.html)
- [esbuild plugin document](/plugins/plugin-esbuild.html)

:::tip SWC vs esbuild
The SWC compiled outputs has better compatibility, supports polyfills such as core-js, and has more complete features, so it is recommended to use the SWC plugin first.
:::

### Avoid using ts-loader

By default, Builder uses Babel to compile TS files. After enabling the [tools.tsLoader](/en/api/config-tools.html#toolstsloader) option, `ts-loader` will be used to compile TS files.

Please avoid using `ts-loader` because it requires additional parsing and type checking, which will slow down the build.

```js
export default {
  tools: {
    // remove this config
    tsLoader: {},
  },
};
```

See the [tools.tsLoader documentation](/en/api/config-tools.html#toolstsloader) for details.

## Development optimization strategies

The following are strategies for improve build performance in development environment.

### Enable Lazy Compilation

You can enable the lazy compilation (i.e. on-demand compilation) to improve the compilation startup speed.

```ts
export default {
  experiments: {
    lazyCompilation: {
      imports: true,
      entries: false,
    },
  },
};
```

This is an experimental feature and may not work correctly in some scenarios, see [experiments.lazyCompilation](/en/api/config-experiments.html#experiments-lazycompilation) for details.

### Adjust Source Map format

In order to provide a good debugging experience, Builder uses the `cheap-module-source-map` format Source Map by default in the development environment, which is a high-quality Source Map format and will bring certain performance overhead.

You can improve build speed by adjusting the source map format of your development environment.

For example to disable Source Map:

```js
export default {
  tools: {
    webpackChain(chain, { env }) {
      if (env === 'development') {
        chain.devtool(false);
      }
    },
  },
};
```

Or set the source map format of the development environment to the cheapest `eval` format:

```js
export default {
  tools: {
    webpackChain(chain, { env }) {
      if (env === 'development') {
        chain.devtool('eval');
      }
    },
  },
};
```

> For detailed differences between different Source Map formats, see [webpack - devtool](https://webpack.js.org/configuration/devtool/).

### Adjust Browserslist for development

This strategy is similar to ["Adjust Browserslist"](/en/guide/optimization/optimize-bundle.html#adjust-browserslist), the difference is that we can set different browserslist for development and production environment, thereby reducing the compilation overhead in the development environment.

For example, you can add the following config to `package.json`, which means that only the latest browsers are compatible in the development environment, and the actual browsers are compatible in the production environment:

```json
{
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

Note that this strategy can lead to some differences in the build result of development production environment.

## Production optimization strategies

The following are strategies for improve build performance in production environment.

### Disable Source Map

If your project does not need Source Map in the production, you can turn it off through the `disableSourceMap` config to improve the build speed.

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```

See [output.disableSourceMap](/en/api/config-output.html#outputdisablesourcemap) for details.
