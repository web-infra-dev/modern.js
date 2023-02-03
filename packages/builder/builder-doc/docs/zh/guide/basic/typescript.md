# 使用 TypeScript

Builder 对 TypeScript 的转译和类型检查做了默认支持，无需任何配置即可在项目中使用 `.ts` 和 `.tsx` 文件。

## TypeScript 转译

Builder 有三种可选方式处理 TypeScript 文件。

**Babel**

在默认配置下，源码中所有的 TypeScript 文件会经过 Babel 转译。
可能你在查阅较老旧的资料时会发现，Babel 无法处理 `const enum` 以及 `namespace alias` 语法，但是其实在 [7.15](https://babeljs.io/blog/2021/07/26/7.15.0) 版本已经得到了支持。Babel 无需手动开启，直接在项目中使用 TypeScript 文件即可。

**ts-loader**

ts-loader 使用 TypeScript 官方的 TSC 转译。当开启 ts-loader 后 TypeScript 文件不会再经过 Babel 编译处理，但处理后的 JavaScript 产物仍然会由 Babel 进行语法降级以及 Polyfill 注入。

开启 ts-loader(使用默认配置):

```ts
export default {
  tools: {
    tsLoader: {},
  },
};
```

更详细配置可见 [tools.tsLoader](/api/config-tools.html#toolstsloader)。
如果开启 ts-loader，默认不会启用类型检查，只会进行转译。

**SWC**

如果想要更快的项目构建速度，并且项目没有依赖某些自定义的 Babel 插件，那么也可以选择 SWC 来对 JavaScript 和 TypeScript 进行转译和压缩。Builder 的 SWC 插件默认支持 TypeScript, TSX, Decorator，使用方式可见 [SWC 插件](/plugins/plugin-swc.html)。

### 为什么默认使用 Babel

Babel 除了没有类型检查以外，对 TypeScript 语法支持已经非常完善，而类型检查可以借助另外的工具更好地进行。转译到低版本的 JavaScript 时，某些语法 Babel 会处理得更符合标准，例如 Babel 会将类成员初始化为 undefined，将类方法标记不可枚举等行为。如果启用 ts-loader，为了更精确的语法降级和 Polyfill，最后还是会将处理后的产物再次经过 Babel 处理，产生不必要的性能开销。

## 类型检查

目前生产可用的类型检查工具只有官方的 TSC，TSC 类型检查耗时在大项目中往往是很慢的过程，Builder 中默认使用 tsChecker([fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)) 在构建过程中异步进行类型检查，不阻塞项目的启动。

配置 tsChecker(使用默认配置):

```ts
export default {
  tools: {
    tsChecker: {},
  },
};
```

更多配置可见 [tsChecker 配置](/api/config-tools.html#toolstschecker)。
如果开启 ts-loader 并且手动配置了 `compileOnly: false`，请关闭 tsChecker，避免重复类型检查。

:::tip STC
SWC 作者新开源的基于 Rust 的类型检查工具 [STC](https://github.com/dudykr/stc) 目前还不可用于生产，还在起步阶段，不推荐用于项目中，等待之后更成熟，会集成到 Builder 的 SWC 插件中作为实验功能，敬请期待。
:::
