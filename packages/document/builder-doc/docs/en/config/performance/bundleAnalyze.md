- **Type:** `Object | undefined`

You have two ways to enable `webpack-bundle-analyzer` to analyze the size of output files:

- Add environment variable `BUNDLE_ANALYZE=true`.
- Add `performance.bundleAnalyze` config.

By default, `webpack-bundle-analyzer` is not enabled. When enabled, its configuration is as follows:

```js
{
  analyzerMode: 'static',
  openAnalyzer: false,
  // `target` is the compilation target, such as `web`, `node`, etc.
  reportFilename: `report-${target}.html`,
}
```

You can override the default config through `performance.bundleAnalyze`, for example:

```js
export default {
  performance: {
    bundleAnalyze: {
      analyzerMode: 'server',
      openAnalyzer: true,
    },
  },
};
```
