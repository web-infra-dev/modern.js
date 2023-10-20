- **类型：** `Object`
- **默认值：** `{ strategy: 'split-by-experience' }`

`performance.chunkSplit` 用于配置 Builder 的拆包策略。配置项的类型 `ChunkSplit` 如下:

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

Builder 支持设置以下几种拆包策略：

- `split-by-experience`: 根据经验制定的拆分策略，自动将一些常用的 npm 包拆分为体积适中的 chunk。
- `split-by-module`: 按 NPM 包的粒度拆分，每个 NPM 包对应一个 chunk。
- `split-by-size`：根据模块大小自动进行拆分。
- `all-in-one`: 将所有代码全部打包到一个 chunk 中。
- `single-vendor`: 将所有 NPM 包的代码打包到一个单独的 chunk 中。
- `custom`: 自定义拆包配置。

### 默认拆包策略

Builder 默认采用 `split-by-experience` 策略，这是我们根据经验制定的策略。具体来说，当你的项目中引用了以下 npm 包时，它们会自动被拆分为单独的 chunk：

- `lib-polyfill.js`：包含 `core-js`，`@babel/runtime`，`@swc/helpers`，`tslib`。
- `lib-react.js`：包含 `react`，`react-dom`。
- `lib-router.js`：包含 `react-router`，`react-router-dom`，`history`，`@remix-run/router`。
- `lib-lodash.js`：包含 `lodash`，`lodash-es`。
- `lib-antd.js`：包含 `antd`。
- `lib-arco.js`：包含 `@arco-design/web-react`。
- `lib-semi.js`：包含 `@douyinfe/semi-ui`。

:::tip
如果项目中没有安装或引用以上 npm 包，则不会生成相应的 chunk。
:::

如果你想使用其他拆包策略，可以通过 `performance.chunkSplit.strategy` 配置项来指定。

:::tip
在使用 Rspack 作为打包工具时，暂时不支持采用 `split-by-module` 策略。
:::

### chunkSplit.minSize

- **类型：** `number`
- **默认值：** `10000`

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

- **类型：** `number`
- **默认值：** `Infinity`

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

- **类型：** `RegExp[] | Record<string, RegExp>`
- **默认值：** `[]`

通过 `performance.chunkSplit.forceSplitting` 配置项可以将指定的模块强制拆分为一个独立的 chunk。

比如将 node_modules 下的 `axios` 库拆分到 `axios.js` 中：

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

相比直接配置 webpack 的 splitChunks，这是一个更加简便的方式。

:::tip
注意，通过 `forceSplitting` 配置拆分的 chunk 会通过 `<script>` 标签插入到 HTML 文件中，作为首屏请求的资源。因此，请根据实际场景来进行适当地拆分，避免首屏资源体积过大。
:::

### chunkSplit.splitChunks

当 `performance.chunkSplit.strategy` 为 `custom` 时，可以通过 `performance.chunkSplit.splitChunks` 配置项来指定自定义的 webpack 拆包配置。此配置会和 webpack 的 splitChunks 配置进行合并（cacheGroups 配置也会合并）。比如:

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

当 `performance.chunkSplit.strategy` 为 `split-by-experience`、`split-by-module`、`split-by-size` 或 `single-vendor` 时，可以通过 `performance.chunkSplit.override` 配置项来自定义 webpack 拆包配置，此配置会和 webpack 的 splitChunks 配置进行合并（cacheGroups 配置也会合并）。比如:

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

> 当 Builder 构建 "node" 类型的产物时，由于 Node Bundles 不需要通过拆包来优化加载性能，因此 chunkSplit 规则不会生效。
