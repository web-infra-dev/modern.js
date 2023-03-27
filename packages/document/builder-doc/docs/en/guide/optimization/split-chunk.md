# Chunk Splitting Practice

A great chunk splitting strategy is very important to improve the loading performance of the application. It can make full use of the browser's caching mechanism to reduce the number of requests and improve the loading speed of the application.

A variety of chunk splitting strategies are built into Builder, which can meet the needs of most applications. You can also customize the chunk splitting config according to your own business scenarios.

## Splitting Strategies

> The chunk splitting config of Builder is in [performance.chunkSplit](/en/api/config-performance.html#performancechunksplit).

Builder supports the following chunk splitting strategies:

- `split-by-experience`: an empirical splitting strategy, automatically splits some commonly used npm packages into chunks of moderate size.
- `split-by-module`: split by NPM package granularity, each NPM package corresponds to a chunk.
- `split-by-size`: automatically split according to module size.
- `all-in-one`: bundle all codes into one chunk.
- `single-vendor`: bundle all NPM packages into a single chunk.
- `custom`: custom chunk splitting strategy.

### split-by-experience

#### Behavior

Builder adopts the `split-by-experience` strategy by default, which is a strategy we have developed from experience. Specifically, when the following npm packages are referenced in your project, they will automatically be split into separate chunks:

- `lib-polyfill.js`: includes `core-js`, `@babel/runtime`, `@swc/helpers`.
- `lib-react.js`: includes `react`, `react-dom`.
- `lib-router.js`: includes `react-router`, `react-router-dom`, `history`, `@remix-run/router`.
- `lib-lodash.js`: includes `lodash`, `lodash-es`.
- `lib-antd.js`: includes `antd`.
- `lib-arco.js`: includes `@arco-design/web-react`.
- `lib-semi.js`: includes `@douyinfe/semi-ui`.

This strategy groups commonly used packages and then splits them into separate chunks. Generally, the number of chunks is not large, which is suitable for most applications and is also our recommended strategy.

:::tip
If the above npm packages are not installed or used in the project, the corresponding chunk will not be generated.
:::

#### Config

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
};
```

### split-by-module

#### Behavior

Split each NPM package into a Chunk.

::: warning
This strategy will split the node_modules in the most granular way, and at the same time, under HTTP/2, multiplexing will speed up the loading time of resources.However, in non-HTTP/2 environments, it needs to be used with caution because of HTTP head-of-line blocking problem.
:::

#### Config

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-module',
    },
  },
};
```

### all-in-one

#### Behavior

This strategy puts business code and third-party dependencies in the same Chunk.

#### Config

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
};
```

### single-vendor

#### Behavior

This strategy puts third-party dependencies in one Chunk, and business code in another Chunk.

#### Config

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'single-vendor',
    },
  },
};
```

### split-by-size

#### Behavior

Under this strategy, after setting `minSize`, `maxSize` to a fixed value, Builder will automatically split them without extra config.

#### Config

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-size',
      minSize: 30000,
      maxSize: 50000,
    },
  },
};
```

## Custom Splitting Strategy

In addition to using the built-in strategies, you can also customize the splitting strategy to meet more customization needs. Custom strategy is divided into two parts:

- Custom group
- Custom webpack `splitChunks` config

It is worth noting that these two custom capabilities can be used together with the built-in strategy, that is, you can use the built-in strategy to split commonly used packages, and then use the custom function to split other packages.

### Custom Group

Builder supports custom group, which is more flexible than the built-in strategies, and simpler than writing webpack config. For example:

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        // Split lodash into a Chunk
        lodash: [/node_modules\/lodash/, /node_modules\/lodash-es/],
      },
    },
  },
};
```

Through `forceSplitting` config, you can easily split some packages into a Chunk.

### Custom Webpack `splitChunks` Config

In addition to using custom grouping, you can also customize the native webpack config through `override`, such as:

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: 'all',
        minSize: 30000,
      },
    },
  },
};
```

The config in `override` will be merged with the webpack config. For specific config details, please refer to [webpack official documentation](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks).
