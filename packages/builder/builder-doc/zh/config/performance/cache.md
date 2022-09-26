- **Type**

```ts
type CacheConfig = {
  /**
   * webpack 文件缓存系统的缓存目录 (默认值为: ./node_modules/.cache/webapck)
   */
  cacheDirectory?: string;
};
```

- **Deafult**: `undefined`

缓存 Webpack 打包过程中生成的 module 和 chunk, 以此来提升构建速度。

默认情况下，webpack-builder 会将目录 `./node_modules/.cache/webpack` 作为打包的缓存目录。

你也可以通过 `cache` 配置缓存路径，比如：

```js
export default {
  performance: {
    cache: {
      cacheDirectory: './node_modules/.custom_cache/webpack',
    },
  },
};
```
