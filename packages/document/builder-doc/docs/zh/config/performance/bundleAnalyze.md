- **类型：** `Object | undefined`

用于开启 [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) 插件来分析产物体积。

默认情况下，Builder 不会开启 `webpack-bundle-analyzer`。当开启该功能后，内部的默认配置如下:

```js
const defaultConfig = {
  analyzerMode: 'static',
  openAnalyzer: false,
  // target 为编译目标，如 `web`、`node` 等
  reportFilename: `report-${target}.html`,
};
```

### 启用 Bundle Analyze

你有两种方式开启 `webpack-bundle-analyzer` 来分析构建产物的体积:

- 添加环境变量 `BUNDLE_ANALYZE=true`，比如：

```bash
BUNDLE_ANALYZE=true pnpm build
```

- 配置 `performance.bundleAnalyze` 来固定开启：

```js
export default {
  performance: {
    bundleAnalyze: {},
  },
};
```

在启用后，Builder 会生成一个分析构建产物体积的 HTML 文件，并在 Terminal 中打印以下日志：

```bash
Webpack Bundle Analyzer saved report to /Project/my-project/dist/report-web.html
```

手动在浏览器中打开该文件，可以看到打包产物的瓦片图；区块的面积越大，说明该模块的体积越大。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png)

### 覆盖默认配置

你可以通过 `performance.bundleAnalyze` 来覆盖默认配置，比如开启 `server` 模式：

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

### Size 类型

在 `webpack-bundle-analyzer` 的面板中，你可以在左上角控制 Size 类型（默认为 `Parsed`）：

- `Stat`：从打包工具的 `stats` 对象中获取的体积，它反映了代码在压缩之前的体积。
- `Parsed`：磁盘上的文件体积，它反映了代码在压缩之后的体积。
- `Gzipped`：浏览器里请求的文件体积，它反映了代码在压缩和 gzip 后的体积。

### 生成 stats.json

`generateStatsFile` 设置为 true 时，将会生成 stats JSON 文件。

```js
export default {
  performance: {
    bundleAnalyze: {
      generateStatsFile: true,
    },
  },
};
```

### 注意事项

1. 开启 Server 模式会导致 `build` 进程不能正常退出。
2. 开启 bundleAnalyzer 会降低构建性能。因此，在日常开发过程中不应该开启此配置项，建议通过 `BUNDLE_ANALYZE` 环境变量来按需开启。
3. 由于 `dev` 阶段不会进行代码压缩等优化，无法反映真实的产物体积，因此建议在 `build` 阶段分析产物体积。
