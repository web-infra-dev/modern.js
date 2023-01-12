# Chunk Splitting Practice

A great chunk splitting strategy is very important to improve the loading performance of the application. It can make full use of the browser's caching mechanism to reduce the number of requests and improve the loading speed of the application.

A variety of chunk splitting strategies are built into Builder, which can meet the needs of most applications. You can also customize the chunk splitting config according to your own business scenarios.

## Splitting Strategies

> The chunk splitting config of Builder is in [performance.chunkSplit](/en/api/config-performance.html#performance-chunksplit).

The Builder includes the following chunk splitting strategies:

- `split-by-experience`: Built-in splitting strategies (experienced splitting strategies by Builder).
- `split-by-module`: Split according to modules, each NPM package is a chunk.
- `all-in-one`: Both business code and third-party code are in one chunk.
- `single-vendor:` Third-party code is in a vendor chunk.
- `split-by-size`: Split according to chunk size.

### split-by-experience

#### behaviour

Based on past experience, built-in split groups include:

- React (react, react-dom)
- Router (react-router, react-router-dom, history)
- Polyfill (core-js, @babel/runtime)
- Semi (@ies/semi, @douyinfe/semi-ui)
- Arco (@arco-design/web-react)
- Lodash (lodash, lodash-es)

This strategy groups commonly used packages and then splits them into separate chunks. Generally, the number of chunks is not large, which is suitable for most applications and is also our recommended  strategy.

#### config

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

#### behaviour

Split each NPM package into a Chunk.

::: warning warning
This strategy will split the node_modules in the most granular way, and at the same time, under HTTP/2, multiplexing will speed up the loading time of resources.However, in non-HTTP/2 environments, it needs to be used with caution because of HTTP head-of-line blocking problem.
:::

#### config

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

#### behaviour

This strategy puts business code and third-party dependencies in the same Chunk.

#### config

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

#### behaviour

This strategy puts third-party dependencies in one Chunk, and business code in another Chunk.

#### config

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

#### behaviour

Under this strategy, after setting `minSize`, `maxSize` to a fixed value, webpack will automatically split them without extra config.


#### config

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

It is worth noting that these two custom capabilities can be used together with the built-in  strategy, that is, you can use the built-in strategy to split commonly used packages, and then use the custom function to split other packages.

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
    }
  }
}
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
      }
    }
  }
}
```

The config in `override` will be merged with the webpack config. For specific config details, please refer to [webpack official documentation](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks).
