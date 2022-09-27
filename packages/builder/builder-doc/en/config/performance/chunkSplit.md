- Type: `Object`
- Default: `{ strategy: 'split-by-experience' }`

`performance.chunkSplit` is used to configure the chunk splitting strategy. The type of `ChunkSplit` is as follows:

```ts
interface BaseChunkSplit {
  strategy?: 'split-by-module' | 'split-by-experience' | 'all-in-one' | 'single-vendor';
  override?: SplitChunks;
  forceSplitting?: Array<RegExp>;
}

interface SplitBySize {
  strategy?: 'split-by-size';
  minSize?: number;
  maxSize?: number;
  override?: SplitChunks;
  forceSplitting?: Array<RegExp>;
}

interface SplitCustom {
  strategy?: 'custom';
  splitChunks?: SplitChunks;
  forceSplitting?: Array<RegExp>;
}

export type ChunkSplit = BaseChunkSplit | SplitBySize | SplitCustom;
```

### chunkSplit.strategy

Builder provides the following chunk splitting strategies:

- `split-by-experience`: split by experience, the default strategy
- `split-by-module`: split a chunk per npm package
- `split-by-size`: split by chunk size
- `all-in-one`: all code is bundled into a single chunk
- `single-vendor`: The code in node_modules is bundled into a single chunk
- `custom`: custom chunk splitting strategy

Builder use `split-by-experience` strategy by default, in which the following npm package group will be split into a single chunk:

- `react` and `react-dom`
- `react-router`、`history` and `react-router-dom`
- `antd` component library
- `semi` component library
- `arco` component library
- `@babel/runtime` (including `@babel/runtime-corejs2`、 `@babel/runtime-corejs3`)
- `lodash`、`lodash-es`
- `core-js`

If you want to use other splitting strategies, you can specify it via `performance.chunkSplit.strategy`.

### chunkSplit.minSize

- Type: `number`
- Default: `10000`

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

- Type: `number`
- Default: `Infinity`

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

- Type: `Array<RegExp>`
- Default: `[]`

Via `performance.chunkSplit.forceSplitting`, you can specify the NPM packages that need to be forced to split. For example:

```js
export default {
  performance: {
    chunkSplit: {
      forceSplitting: [/^@arco-design\/web-react/],
    },
  },
};
```

This is an easier way than configuring Webpack's splitChunks directly.

### chunkSplit.splitChunks

When `performance.chunkSplit.strategy` is `custom`, you can specify the custom Webpack chunk splitting config via `performance.chunkSplit.splitChunks`. This config will be merged with the Webpack splitChunks config (the `cacheGroups` config will also be merged). For example:

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

When `performance.chunkSplit.strategy` is `split-by-experience`, `split-by-module`, `split-by-size` or `single-vendor`, you can specify the custom Webpack chunk splitting config via `performance.chunkSplit.override`. This config will be merged with the Webpack splitChunks config (the `cacheGroups` config will also be merged). For example:

```js
export default {
  performance: {
    strategy: 'split-by-experience',
    chunkSplit: {
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
