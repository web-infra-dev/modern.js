# TypeScript

Builder 对 TypeScript 的转译和类型检查做了默认支持，无需任何配置即可在项目中使用 `.ts` 和 `.tsx` 文件。

## TypeScript 转译

Builder 有三种可选方式处理 TypeScript 文件。

### Babel

在默认配置下，源码中所有的 TypeScript 文件会经过 Babel 转译。
可能你在查阅较老旧的资料时会发现，Babel 无法处理 `const enum` 以及 `namespace alias` 语法，但是其实在 [7.15](https://babeljs.io/blog/2021/07/26/7.15.0) 版本已经得到了支持。

### ts-loader

ts-loader 使用 TypeScript 官方的 TSC 转译，性能上与 Babel 接近。当开启 ts-loader 后 TypeScript 文件不会在经过 Babel 处理。配置可见 [`tools.tsLoader`](/zh/api/config-tools.html#tools.tsLoader)。
如果开启 ts-loader，默认并不会启用类型检查，而只是做转译，类型检查则使用的 `fork-ts-checker-webpack-plugin`。

### SWC

如果想要更快的项目构建速度，并且项目并没有依赖某些自定义的 Babel 插件，那么也可以选择 SWC 来对 JavaScript 和 TypeScript 进行转译和压缩。Builder 的 SWC 插件默认支持 TypeScript, TSX, decorator，使用方式可见 [SWC 插件](/zh/plugins/plugin-swc.html)。

## 类型检查

Builder 中默认使用 tsChecker(`fork-ts-checker-webpack-plugin`) 在构建过程中异步进行类型检查，不阻塞项目的启动。具体可见 [tsChecker 配置](/zh/api/config-tools.html#tools.tsChecker)。

如果转译使用 ts-loader 并且手动配置了 `compileOnly: false`，请关闭 tsChecker，避免重复类型检查。
