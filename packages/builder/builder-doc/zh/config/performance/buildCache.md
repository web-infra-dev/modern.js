- **Type**

```ts
type BuildCacheConfig =
  | {
      /**
       * webpack 文件缓存系统的缓存目录
       */
      cacheDirectory?: string;
    }
  | boolean;
```

- **Default**:

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webapck',
};
```

缓存 webpack 打包过程中生成的 module 和 chunk, 以此来提升构建速度。

默认情况，Builder 会开启缓存功能，将目录 `./node_modules/.cache/webpack` 作为打包的缓存目录。

你可以通过 `buildCache` 配置缓存路径，比如：

```js
export default {
  performance: {
    buildCache: {
      cacheDirectory: './node_modules/.custom_cache/webpack',
    },
  },
};
```

如果不希望缓存，你也可以将 `buildCache` 置为 `false` 将其禁用掉：

```js
export default {
  performance: {
    buildCache: false,
  },
};
```
