# 拆包最佳实践

良好的拆包策略对于提升应用的加载性能是十分重要的，可以充分利用浏览器的缓存机制，减少请求数量，加快页面加载速度。

在 Builder 中内置了多种拆包策略，可以满足大部分应用的需求，你也可以根据自己的业务场景，自定义拆包配置。

## 拆包策略

> Builder 的拆包配置集中在 [performance.chunkSplit](/api/config-performance.html#performancechunksplit) 中。

Builder 支持设置以下几种拆包策略：

- `split-by-experience`: 根据经验制定的拆分策略，自动将一些常用的 npm 包拆分为体积适中的 chunk。
- `split-by-module`: 按 NPM 包的粒度拆分，每个 NPM 包对应一个 chunk。
- `split-by-size`：根据模块大小自动进行拆分。
- `all-in-one`: 将所有代码全部打包到一个 chunk 中。
- `single-vendor`: 将所有 NPM 包的代码打包到一个单独的 chunk 中。
- `custom`: 自定义拆包配置。

### split-by-experience

#### 分包策略

Builder 默认采用 `split-by-experience` 策略，这是我们根据经验制定的策略。具体来说，当你的项目中引用了以下 npm 包时，它们会自动被拆分为单独的 chunk：

- `lib-polyfill.js`：包含 `core-js`，`@babel/runtime`，`@swc/helpers`。
- `lib-react.js`：包含 `react`，`react-dom`。
- `lib-router.js`：包含 `react-router`，`react-router-dom`，`history`，`@remix-run/router`。
- `lib-lodash.js`：包含 `lodash`，`lodash-es`。
- `lib-antd.js`：包含 `antd`。
- `lib-arco.js`：包含 `@arco-design/web-react` 以及 `@arco-design` 组织下相关的包。
- `lib-semi.js`：包含 `@douyinfe/semi-ui` 以及 `@ies` 和 `@douyinfe` 组织下相关的包。
- `lib-axios.js`：包含 `axios` 以及相关的包。

这种拆包策略将常用的包进行分组，然后拆分为单独的 chunk，一般 chunk 的数量不会很多，适合绝大部分应用，同时也是我们推荐的拆包策略。

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

#### 注意事项

- 如果项目中没有安装或引用以上 npm 包，则不会生成相应的 chunk。

### split-by-module

#### 分包策略

将每一个 NPM 包拆分为一个单独的 chunk。

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

#### 注意事项

- 这个配置会最细化地拆分 node_modules，产生大量的文件请求。
- 在使用 HTTP/2 时，由于存在多路复用，会加快资源的加载时间，并提高缓存命中率。
- 在未使用 HTTP/2 时，由于 HTTP 队头阻塞问题，会导致页面加载性能下降，请谨慎使用。

### all-in-one

#### 分包策略

此分包策略将业务代码、第三方依赖打包在同一个 chunk 中。

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

#### 注意事项

- 这个配置会将构建生成的 JS 代码全部打包到一个文件里（除了 dynamic import 拆分的 chunk）
- 单个 JS 文件的体积可能会非常大，使页面加载性能下降。

### single-vendor

#### 分包策略

此分包策略将第三方依赖打包在一个 chunk 中，业务代码打包在另外的 chunk 中。

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

#### 注意事项

- 单个 vendor 文件的体积可能会非常大，使页面加载性能下降。

### split-by-size

#### 分包策略

该策略下，设置 `minSize`、`maxSize` 为一个固定值后，Builder 会自动进行拆分，无需干预。

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
- 自定义原生 bundler 拆包配置

值得注意的是，这两种自定义拆包能力可以和内置的拆包策略一起使用，也就是说，你可以使用内置的拆包策略来拆分常用的包，然后再使用自定义拆包功能来拆分其他的包。

### 自定义分组

Builder 支持自定义拆包分组，这样比内置拆包策略更灵活，同时比手写 bundler 底层配置更简单。

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

通过 `forceSplitting` 配置，你可以很方便把某些模块拆分为一个 chunk。

#### 注意事项

通过 `forceSplitting` 配置拆分的 chunk 会通过 `<script>` 标签插入到 HTML 文件中，作为首屏请求的资源。因此，请根据实际场景来进行适当地拆分，避免首屏资源体积过大。

### 自定义 bundler 拆包配置

除了使用自定义分组外，你还可以通过 `override` 配置项来自定义底层 bundler 的拆包配置，比如:

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

其中 `override` 中的配置会和 bundler 的配置进行合并，具体配置项请参考 [webpack - splitChunks](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks) 或 [Rspack - splitChunks](https://rspack.dev/zh/config/optimization.html#optimization-splitchunks)。

## 使用 Dynamic Import 拆包

除了 `chunkSplit` 配置，使用 dynamic import 拆包也是一项重要的优化手段，它可以有效减少首屏的包体积。

:::tip 关于 dynamic import
Dynamic import 是 ECMAScript 2020 引入的一个新特性，它允许你动态地加载一些 JavaScript 模块。Builder 底层的 Rspack / webpack 默认支持 dynamic import，所以你可以直接在代码中使用它。
:::

当打包工具遇到 `import()` 语法时，它会自动将相关的代码分割成一个新的 chunk，并在运行时按需加载。

例如，项目中有一个大的模块 `bigModule.ts`（也可以是一个第三方依赖），你可以使用 dynamic import 来按需加载它：

```js
// 在某个需要使用 bigModule 的地方
import('./bigModule.ts').then(bigModule => {
  // 使用 bigModule
});
```

当你运行构建命令时，`bigModule.ts` 就会被自动分割成一个新的 chunk，并在运行时按需加载。
