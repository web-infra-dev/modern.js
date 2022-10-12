- Type: `Object | undefined`

你有两种方式开启 `webpack-bundle-analyzer` 来分析打包结果:

- 添加环境变量`BUNDLE_ANALYZE=true`；
- 配置 `tools.bundleAnalyze`。

默认情况下，不会开启 `webpack-bundle-analyzer`，当开启之后它的配置如下:

```js
{
  analyzerMode: 'static',
  openAnalyzer: false,
  // target 为编译目标，如 `web`、`node` 等
  reportFilename: `report-${target}.html`,
}
```

你可以通过 `tools.bundleAnalyze` 来覆盖默认配置，比如：

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
