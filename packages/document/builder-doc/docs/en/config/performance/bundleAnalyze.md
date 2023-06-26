- **Type:** `Object | undefined`

Used to enable the [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) plugin to analyze the size of the output.

By default, Builder does not enable `webpack-bundle-analyzer`. When this feature is enabled, the default configuration is as follows:

```js
const defaultConfig = {
  analyzerMode: 'static',
  openAnalyzer: false,
  // target is the compilation target, such as `web`, `node`, etc.
  reportFilename: `report-${target}.html`,
};
```

### Enable Bundle Analyze

You have two ways to enable `webpack-bundle-analyzer` to analyze the size of the output files:

- Add the environment variable `BUNDLE_ANALYZE=true`, for example:

```bash
BUNDLE_ANALYZE=true pnpm build
```

- Configure `performance.bundleAnalyze` to enable it permanently:

```js
export default {
  performance: {
    bundleAnalyze: {},
  },
};
```

After enabling it, Builder will generate an HTML file that analyzes the size of the output files, and print the following log in the Terminal:

```bash
Webpack Bundle Analyzer saved report to /Project/my-project/dist/report-web.html
```

You can manually open the file in the browser and view the detail of the bundle size. When an area is larger, it indicates that its corresponding bundle size is larger.

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png)

### Override Default Configuration

You can override the default configuration through `performance.bundleAnalyze`, such as enabling the server mode:

```js
export default {
  performance: {
    bundleAnalyze: process.env.BUNDLE_ANALYZE
      ? {
          analyzerMode: 'server',
          openAnalyzer: true,
        }
      : {},
  },
};
```

### Size Types

In the `webpack-bundle-analyzer` panel, you can control size types in the upper left corner (default is `Parsed`):

- `Stat`: The size obtained from the `stats` object of the bundler, which reflects the size of the code before minification.
- `Parsed`: The size of the file on the disk, which reflects the size of the code after minification.
- `Gzipped`: The file size requested in the browser reflects the size of the code after minification and gzip.

### Generate stats.json

By setting `generateStatsFile` to true, stats JSON file will be generated in bundle output directory.

```js
export default {
  performance: {
    bundleAnalyze: {
      generateStatsFile: true,
    },
  },
};
```

### Notes

1. Enabling the server mode will cause the `build` process to not exit normally.
2. Enabling `bundleAnalyzer` will reduce build speed. Therefore, this configuration should not be enabled during daily development, and it is recommended to enable it on demand through the `BUNDLE_ANALYZE` environment variable.
3. Since no code minification and other optimizations are performed in the `dev` phase, the real output size cannot be reflected, so it is recommended to analyze the output size in the `build` phase.
