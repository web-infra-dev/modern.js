# 拆包最佳实践

良好的拆包策略对于提升应用的加载性能是十分重要的，可以充分利用浏览器的缓存机制，减少请求数量，加快页面加载速度。

在 Builder 中内置了多种拆包策略，可以满足大部分应用的需求，你也可以根据自己的业务场景，自定义拆包配置。

## 拆包策略

> Builder 的拆包配置集中在 [performance.chunkSplit](/api/config-performance.html#performance-chunksplit) 中。

Builder 中包括如下的拆包策略：

- `split-by-experience`: 根据经验内置拆分策略（由 Builder 根据经验制定的拆分策略）。
- `split-by-module`: 根据模块进行拆分，每一个 NPM 包就是一个 chunk。
- `all-in-one`: 业务代码和第三方代码都在一个 chunk 中。
- `single-vendor:` 第三方代码在一个 vendor chunk 中。
- `split-by-size`: 根据模块大小进行拆分。


### split-by-experience

#### 分包策略

根据以往的经验，内置的拆分组包括：

- React (react, react-dom)
- Router (react-router, react-router-dom, history)
- Polyfill (core-js, @babel/runtime)
- Semi (@ies/semi, @douyinfe/semi-ui)
- Arco (@arco-design/web-react)
- Lodash (lodash, lodash-es)

这种拆包策略将常用的包进行分组，然后拆分为单独的 Chunk，一般 Chunk 的数量不会很多，适合绝大部分应用，同时也是我们推荐的拆包策略。

#### 配置

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

#### 分包策略

将每一个 NPM 包拆分为一个 Chunk。

::: warning 注意
这样会最细化地拆分 node_modules，同时在 HTTP/2 下因为多路复用会加快资源的加载时间，不过在非 HTTP/2 的环境下因为 HTTP 队头阻塞问题需要慎用。
:::

#### 配置

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

#### 分包策略

此分包策略将业务代码、第三方依赖打包在同一个 Chunk 中。

#### 配置

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

#### 分包策略

此分包策略将第三方依赖打包在一个 Chunk 中，业务代码打包在另外的 Chunk 中。

#### 配置

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

#### 分包策略

该策略下，设置 `minSize`、`maxSize` 为一个固定值后，Webpack 会自动进行拆分，无需干预。


#### 配置

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

## 自定义拆包

除了使用内置的拆包策略外，你也可以通过 Builder 自定义拆包功能来满足更多的定制化需求。自定义拆包分为两部分:

- 自定义拆包分组
- 自定义原生 webpack 拆包配置

值得注意的是，这两种自定义拆包能力可以和内置的拆包策略一起使用，也就是说，你可以使用内置的拆包策略来拆分常用的包，然后再使用自定义拆包功能来拆分其他的包。

### 自定义分组

Builder 支持自定义拆包分组，这样比内置拆包策略更灵活，同时比手写 webpack 配置更简单。比如:

```ts
export default {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      forceSplitting: {
        // 将 lodash 拆分为一个 Chunk
        lodash: [/node_modules\/lodash/, /node_modules\/lodash-es/],
      },
    }
  }
}
```

通过 `forceSplitting` 配置，你可以很方便把某些包拆分为一个 Chunk。

### 自定义 webpack 拆包配置

除了使用自定义分组外，你还可以通过 `override` 配置项来自定义原生 webpack 拆包配置，比如:

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

其中 `override` 中的配置会和 webpack 的配置进行合并，具体配置项请参考 [webpack 官方文档](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks)。
