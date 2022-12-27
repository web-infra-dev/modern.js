- Type:

```ts
type LazyCompilationOptions =
  | boolean
  | {
      // 是否为异步模块开启延迟编译
      imports?: boolean;
      // 是否为入口模块开启延迟编译
      entries?: boolean;
    };
```

- Default: `false`

用于开启延迟编译（即按需编译）的能力。当开启此配置项时，Builder 会进行延迟编译，提升项目的编译启动速度。

延迟编译只在开发环境下生效。

### 延迟编译异步模块

延迟编译 [Dynamic Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) 引入的异步模块：

```ts
export default {
  experiments: {
    lazyCompilation: {
      imports: true,
      entries: false,
    },
  },
};
```

开启 `imports` 选项后，所有的异步模块只有在被请求时才触发编译。如果你的项目是一个单页应用（SPA），并通过 Dynamic Import 进行了路由拆分，那么会有明显的编译提速效果。

### 延迟编译入口模块

除了延迟编译异步模块，你也可以选择同时延迟编译入口模块和异步模块。

```ts
export default {
  experiments: {
    lazyCompilation: {
      imports: true,
      entries: true,
    },
  },
};
```

以上配置也可以简化为：

```ts
export default {
  experiments: {
    lazyCompilation: true,
  },
};
```

开启 `entries` 选项后，当启动编译时，不会编译所有的页面，而是仅在路由跳转到对应的页面时，才对该页面进行编译。

使用延迟编译入口模块时，有以下注意事项：

- 只适用于多页应用（MPA），对单页应用（SPA）没有优化效果。
- 当你访问一个页面时，由于要等待页面编译完成，会有一段时间的白屏。

### 局限性

#### 禁用拆包规则

当你开启延迟编译时，为了保证编译结果正常，Builder 会在开发环境下禁用拆包规则。这不会影响生产环境的打包产物，但会导致开发环境和生产环境的打包产物有一定差异。

#### 使用代理

Lazy Compilation 依赖 webpack 在本地启动的开发服务器，当你将某个域名代理到 localhost 进行开发时，Lazy Compilation 将无法正常工作。因此，如果你需要使用代理时，请禁用 Lazy Compilation。
