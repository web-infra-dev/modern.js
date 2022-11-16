# Improve Build Performance

Modern.js Builder optimizes build performance by default, but as the project becomes larger, you may encounter some build performance problems.

This document provides some optional speed-up strategies, developers can choose some of them to improve the build performance.

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

### Using esbuild

[esbuild](https://esbuild.github.io/) is a front-end build tool based on Golang. It has the functions of bundling, compiling and minimizing JavaScript code. Compared with traditional tools, the performance is significantly improved. When minimizing code, compared to webpack's built-in terser minimizer, esbuild has dozens of times better performance.

Builder provides esbuild plugin that allow you to use esbuild instead of babel-loader, ts-loader and terser for transformation and minification process. See [esbuild plugin](/plugins/plugin-esbuild.html) for details.

### Reduce duplicate dependencies

In real projects, there will be some third-party dependencies installed with multiple versions. Duplicate dependencies can lead to larger bundles and slower builds.

We can detect or eliminate duplicate dependencies with some community tools.

If you are using `pnpm`, you can use [pnpm-deduplicate](https://github.com/ocavue/pnpm-deduplicate) to analyze all duplicate dependencies, then update dependencies or declare [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides) to merge duplicated dependencies.

```bash
npx pnpm-deduplicate --list
```

If you are using `yarn`, you can use [yarn-deduplicate](https://github.com/scinos/yarn-deduplicate) to automatically merge duplicated dependencies:

```bash
npx yarn-deduplicate && yarn
```

### Use lightweight libraries

It is recommended to using lightweight libraries in your project, such as replacing [moment](https://momentjs.com/) with [day.js](https://day.js.org/).

If you want to find out the large libraries in the project, you can add the [BUNDLE_ANALYZE=true](/en/api/config-performance.html#performance-bundleanalyze) environment variable when building:

```bash
BUNDLE_ANALYZE=true pnpm build
```

After adding this parameter, Builder will generate a HTML file that analyzes the bundle size, you can manually open the file in the browser and view the detail of the bundle size. When an area is larger, it indicates that its corresponding bundle size is larger.

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

### Avoid using ts-loader

By default, Builder uses Babel to compile TS files. After enabling the [tools.tsLoader](/en/api/config-tools.html#tools-tsloader) option, `ts-loader` will be used to compile TS files.

Please avoid using `ts-loader` because it requires additional parsing and type checking, which will slow down the build.

```js
export default {
  tools: {
    // remove this config
    tsLoader: {},
  },
};
```

See the [tools.tsLoader documentation](/en/api/config-tools.html#tools-tsloader) for details.

### Adjust Browserslist

The Builder will compile the code according to the project's Browserslist config, and inject some Polyfills. If the project does not need to be compatible with legacy browsers, you can adjust the Browserslist and drop some legacy browsers, thereby reducing the compilation overhead on syntax and polyfill.

Builder's default Browserslist config is:

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

For example, if you only need to be compatible with browsers above Chrome 61, you can change it to:

```js
['Chrome >= 61'];
```

### Usage Polyfill

When it is clear that third-party dependencies do not require additional polyfill, you can set [output.polyfill](/en/api/config-output.html#output-polyfill) to `usage`.

In the case where it is clear that third-party dependencies do not require Polyfill, you can set [output.polyfill](/zh/api/config-output.html#output-polyfill) to `usage`.

In `usage` mode, Builder analyzes the syntax used in the source code and injects the required polyfill code on demand to reduce the size of polyfill.

```js
export default {
  output: {
    polyfill: 'usage',
  },
};
```

## Development optimization strategies

The following are strategies for improve build performance in development environment.

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

This strategy is similar to "Adjust Browserslist", the difference is that we can set different browserslist for development and production environment, thereby reducing the compilation overhead in the development environment.

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

See [output.disableSourceMap](/en/api/config-output.html#output-disablesourcemap) for details.
