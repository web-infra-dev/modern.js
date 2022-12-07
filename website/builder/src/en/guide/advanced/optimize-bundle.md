# Bundle Size Optimization

Bundle size optimization is an important part in production environment because it directly affects the user experience of online users. In this document, we will introduce some common bundle size optimization methods in Builder.

## Reduce duplicate dependencies

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

## Use lightweight libraries

It is recommended to using lightweight libraries in your project, such as replacing [moment](https://momentjs.com/) with [day.js](https://day.js.org/).

If you want to find out the large libraries in the project, you can add the [BUNDLE_ANALYZE=true](/en/api/config-performance.html#performance-bundleanalyze) environment variable when building:

```bash
BUNDLE_ANALYZE=true pnpm build
```

After adding this parameter, Builder will generate a HTML file that analyzes the bundle size, you can manually open the file in the browser and view the detail of the bundle size. When an area is larger, it indicates that its corresponding bundle size is larger.

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

## Adjust Browserslist

The Builder will compile the code according to the project's Browserslist config, and inject some Polyfills. If the project does not need to be compatible with legacy browsers, you can adjust the Browserslist and drop some legacy browsers, thereby reducing the compilation overhead on syntax and polyfill.

Builder's default Browserslist config is:

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

For example, if you only need to be compatible with browsers above Chrome 61, you can change it to:

```js
['Chrome >= 61'];
```

## Usage Polyfill

When it is clear that third-party dependencies do not require additional polyfill, you can set [output.polyfill](/en/api/config-output.html#output-polyfill) to `usage`.

In the case where it is clear that third-party dependencies do not require Polyfill, you can set [output.polyfill](/en/api/config-output.html#output-polyfill) to `usage`.

In `usage` mode, Builder analyzes the syntax used in the source code and injects the required polyfill code on demand to reduce the size of polyfill.

```js
export default {
  output: {
    polyfill: 'usage',
  },
};
```

## Image Compression

In general front-end projects, the size of image often accounts for a large proportion of the total bundle size of the project.So if the image size can be reduced as much as possible, it will have a significant optimization effect on the project bundle size. You can enable image compression by registering a plugin in the Builder:

```js
import { PluginImageCompress } from '@modern-js/builder-plugin-image-compress';

// Add the plugin to the Builder
builder.addPlugins([PluginImageCompress()]);
```

See details in [plugin-image-compress](/en/plugins/plugin-image-compress)。

## Split Chunk

A great chunk splitting strategy is very important to improve the loading performance of the application. It can make full use of the browser's caching mechanism to reduce the number of requests and improve the loading speed of the application.

A variety of [chunk splitting strategies](/en/guide/advanced/split-chunk) are built into Builder, which can meet the needs of most applications. You can also customize the chunk splitting config according to your own business scenarios. For example:

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        // For example, split the `react-query` into a Chunk
        react_query: [/node_modules\/react-query/],
      },
    },
  },
};
```
