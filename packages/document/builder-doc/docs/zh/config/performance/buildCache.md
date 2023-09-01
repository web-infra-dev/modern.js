- **类型：**

```ts
type BuildCacheConfig =
  | {
      /**
       * webpack 文件缓存系统的缓存目录
       */
      cacheDirectory?: string;
      /**
       * 根据 cacheDigest 内容设置不同的缓存名称
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

### cacheDigest

`cacheDigest` 用来添加一些会对构建结果产生影响的环境变量。Builder 将根据 `cacheDigest` 内容和当前构建模式来设置缓存名称，来确保不同的 `cacheDigest` 可以命中不同的缓存。

#### 示例

当前项目需要根据不同的 `APP_ID` 来设置不同的 extensions。默认情况下，由于当前项目的代码 & 配置 & 依赖未发生变化，会命中之前的缓存。
通过将 `APP_ID` 添加到 `cacheDigest` 中，在 `APP_ID` 变化时会去查找不同的缓存结果，从而避免命中不符合预期的缓存结果。

```js
export default {
  tools: {
    bundlerChain: chain => {
      if (process.env.APP_ID === 'xxx') {
        chain.resolve.extensions.prepend('.ttp.ts');
      }
    },
  },
  performance: {
    buildCache: {
      cacheDigest: [process.env.APP_ID],
    },
  },
};
```
