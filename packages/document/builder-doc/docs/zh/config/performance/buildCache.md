- **类型：**

```ts
type BuildCacheConfig =
  | {
      /**
       * webpack 文件缓存系统的缓存目录
       */
      cacheDirectory?: string;
      /**
       * 影响构建结果的变量
       */
      cacheDigest?: Array<string | undefined>;
    }
  | boolean;
```

- **默认值：**

```js
const defaultBuildCacheConfig = {
  cacheDirectory: './node_modules/.cache/webpack',
};
```

- **打包工具：** `仅支持 webpack`

控制 Builder 在构建过程中的缓存行为。

Builder 默认会开启构建缓存来提升二次构建的速度，并默认把生成的缓存文件写到 `./node_modules/.cache/webpack` 目录下。

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

如果当前项目存在一些环境变量会对构建结果产生影响，可添加到 cacheDigest 中：

```js
export default {
  tools: {
    bundlerChain: chain => {
      if (process.env.APP_ID === 'xxx') {
        chain.resolve.extensions.prepend('.ttp.ts');
      }
  },
  performance: {
    buildCache: {
      cacheDigest: [process.env.APP_ID]
    },
  },
};
```
