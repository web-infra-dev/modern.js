- Type: `Object`
- Default: `{ strategy: 'split-by-experience' }`

`performance.chunkSplit` 用于配置 Builder 的拆包策略。配置项的类型`ChunkSplit`如下:

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

Builder 支持六种类型的拆包策略:

- `split-by-experience`: 根据经验内置拆分策略
- `split-by-module`: 根据 NPM 包拆分，每个 NPM 包一个 chunk
- `split-by-size`: 根据 chunk 大小拆分
- `all-in-one`: 所有代码打包到一个 chunk
- `single-vendor`: node_modules 中的代码打包到一个单独的 chunk
- `custom`: 自定义拆包配置

Builder 默认采用 `split-by-experience` 策略，具体来说，以下的 NPM 包分组会被拆分为单独的 chunk:

- `react` 和 `react-dom`
- `react-router`、`history` 和 `react-router-dom`
- `antd` 组件库
- `semi` 组件库
- `arco` 组件库
- `@babel/runtime` 的代码(也包括 `@babel/runtime-corejs2`、 `@babel/runtime-corejs3`)
- `lodash` 和 `lodash-es`
- `core-js`

如果你想使用其他拆包策略，可以通过 `performance.chunkSplit.strategy` 配置项来指定。

### chunkSplit.minSize

- Type: `number`
- Default: `10000`

当 `performance.chunkSplit.strategy` 为 `split-by-size` 时，可以通过 `performance.chunkSplit.minSize` 配置项来指定 chunk 的最小大小，单位为字节。默认值为 10000。比如:

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

当 `performance.chunkSplit.strategy` 为 `split-by-size` 时，可以通过 `performance.chunkSplit.maxSize` 配置项来指定 chunk 的最大大小，单位为字节。默认值为 `Infinity`。比如:

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

通过 `performance.chunkSplit.forceSplitting` 配置项可以指定强制拆包的 NPM 包。比如:

```js
export default {
  performance: {
    chunkSplit: {
      forceSplitting: [/^@arco-design\/web-react/],
    },
  },
};
```

相比直接配置 Webpack 的 splitChunks，这是一个更加简便的方式。

### chunkSplit.splitChunks

当 `performance.chunkSplit.strategy` 为 `custom` 时，可以通过 `performance.chunkSplit.splitChunks` 配置项来指定自定义的 Webpack 拆包配置。此配置会和 Webpack 的 splitChunks 配置进行合并（cacheGroups 配置也会合并）。比如:

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

当 `performance.chunkSplit.strategy` 为 `split-by-experience`、`split-by-module`、`split-by-size` 或 `single-vendor` 时，可以通过 `performance.chunkSplit.override` 配置项来自定义 Webpack 拆包配置，此配置会和 Webpack 的 splitChunks 配置进行合并（cacheGroups 配置也会合并）。比如:

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
