- Type: `boolean`

- Default: `false`

是否捕获每个模块的耗时信息，对应 webpack 的 [profile](https://webpack.js.org/configuration/other-options/#profile) 配置。

#### 示例

```js
export default {
  performance: {
    profile: true,
  },
};
```

开启后，Webpack 生成一些有关模块的统计数据的 JSON 文件会将模块构建的耗时信息也包含进去。
