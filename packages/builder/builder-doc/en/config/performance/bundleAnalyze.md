- Type: `Object | undefined`

You have two ways to enable `webpack-bundle-analyzer` to analyze webpack output:

- Add environment variable `BUNDLE_ANALYZE=true`.
- Add `tools.bundleAnalyze` config.

By default, `webpack-bundle-analyzer` is not enabled. When enabled, its configuration is as follows:

```js
{
  analyzerMode: 'static',
  openAnalyzer: false,
  // `target` is the compilation target, such as `web`, `node`, etc.
  reportFilename: `report-${target}.html`,
}
```

You can override the default config through `tools.bundleAnalyze`, for example:

```js
export default {
  tools: {
    bundleAnalyze: {
      analyzerMode: 'server',
      openAnalyzer: true,
    },
  },
};
```
