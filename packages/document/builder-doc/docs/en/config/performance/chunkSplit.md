- **Type:** `Object`
- **Default:** `{ strategy: 'split-by-experience' }`

`performance.chunkSplit` is used to configure the chunk splitting strategy. The type of `ChunkSplit` is as follows:

```ts
type ForceSplitting = RegExp[] | Record<string, RegExp>;

interface BaseChunkSplit {
  strategy?:
    | 'split-by-module'
    | 'split-by-experience'
    | 'all-in-one'
    | 'single-vendor';
  override?: SplitChunks;
  forceSplitting?: ForceSplitting;
}

interface SplitBySize {
  strategy?: 'split-by-size';
  minSize?: number;
  maxSize?: number;
  override?: SplitChunks;
  forceSplitting?: ForceSplitting;
}

interface SplitCustom {
  strategy?: 'custom';
  splitChunks?: SplitChunks;
  forceSplitting?: ForceSplitting;
}

export type ChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;
```

### chunkSplit.strategy

Builder supports the following chunk splitting strategies:

- `split-by-experience`: an empirical splitting strategy, automatically splits some commonly used npm packages into chunks of moderate size.
- `split-by-module`: split by NPM package granularity, each NPM package corresponds to a chunk.
- `split-by-size`: automatically split according to module size.
- `all-in-one`: bundle all codes into one chunk.
- `single-vendor`: bundle all NPM packages into a single chunk.
- `custom`: custom chunk splitting strategy.


### Default Strategy

Builder adopts the `split-by-experience` strategy by default, which is a strategy we have developed from experience. Specifically, when the following npm packages are referenced in your project, they will automatically be split into separate chunks:

- `lib-polyfill.js`: includes `core-js`, `@babel/runtime`, `@swc/helpers`.
- `lib-react.js`: includes `react`, `react-dom`.
- `lib-router.js`: includes `react-router`, `react-router-dom`, `history`, `@remix-run/router`.
- `lib-lodash.js`: includes `lodash`, `lodash-es`.
- `lib-antd.js`: includes `antd`.
- `lib-arco.js`: includes `@arco-design/web-react`.
- `lib-semi.js`: includes `@douyinfe/semi-ui`.

:::tip
If the above npm packages are not installed or used in the project, the corresponding chunk will not be generated.
:::

If you want to use other splitting strategies, you can specify it via `performance.chunkSplit.strategy`.

:::tip
The `split-by-module` strategy is not supported when using Rspack as the bundler.
:::

### chunkSplit.minSize

- **Type:** `number`
- **Default:** `10000`

When `performance.chunkSplit.strategy` is `split-by-size`, you can specify the minimum size of a chunk via `performance.chunkSplit.minSize`, the unit is bytes. The default value is `10000`. For example:

```js
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-size',
      minSize: 20000,
    },
  },
};
```

### chunkSplit.maxSize

- **Type:** `number`
- **Default:** `Infinity`

When `performance.chunkSplit.strategy` is `split-by-size`, you can specify the maximum size of a chunk via `performance.chunkSplit.maxSize`, the unit is bytes. The default value is `Infinity`. For example:

```js
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-size',
      maxSize: 50000,
    },
  },
};
```

### chunkSplit.forceSplitting

- **Type:** `RegExp[] | Record<string, RegExp>`
- **Default:** `[]`

Via `performance.chunkSplit.forceSplitting`, you can specify the NPM packages that need to be forced to split.

For example, split the `axios` library under node_modules into `axios.js`:

```js
export default {
   performance: {
     chunkSplit: {
       strategy: 'split-by-experience',
       forceSplitting: {
         axios: /node_modules\/axios/,
       },
     },
   },
};
```

This is an easier way than configuring webpack's splitChunks directly.

### chunkSplit.splitChunks

When `performance.chunkSplit.strategy` is `custom`, you can specify the custom webpack chunk splitting config via `performance.chunkSplit.splitChunks`. This config will be merged with the webpack splitChunks config (the `cacheGroups` config will also be merged). For example:

```js
export default {
  performance: {
    chunkSplit: {
      strategy: 'custom',
      splitChunks: {
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
          },
        },
      },
    },
  },
};
```

### chunkSplit.override

When `performance.chunkSplit.strategy` is `split-by-experience`, `split-by-module`, `split-by-size` or `single-vendor`, you can specify the custom webpack chunk splitting config via `performance.chunkSplit.override`. This config will be merged with the webpack splitChunks config (the `cacheGroups` config will also be merged). For example:

```js
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        cacheGroups: {
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
          },
        },
      },
    },
  },
};
```

> When the Builder target is "node", since Node Bundles do not need to be splitted to optimize loading performance, the chunkSplit rule will not take effect.
