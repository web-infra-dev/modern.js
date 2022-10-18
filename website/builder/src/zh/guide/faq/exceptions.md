# 异常类问题

## webpack 编译出现 'compilation' argument 报错？

如果编译时出现以下报错，通常是由于项目中安装了错误的 webpack 版本，或者安装了多个 webpack 版本引起：

```bash
TypeError: The 'compilation' argument must be an instance of Compilation
```

webpack 版本问题有以下几种情况：

1. 项目的 package.json 中直接声明了 webpack 依赖，并且与 Builder 依赖的 webpack 版本范围不同，无法匹配到同一个版本。
2. 项目里安装的多个 npm 包都依赖了 webpack，并且它们依赖的 webpack 版本范围不同，无法匹配到同一个版本。
3. 由于包管理器的 lock 机制，导致 lock 文件中产生了多个 webpack 版本。

如果是第一种情况，建议从项目的 package.json 中移除 webpack 依赖。因为 Builder 默认封装了 webpack 相关能力，并且会在 [tools.webpack](/zh/api/config-tools.html#tools-webpack) 配置项中传入 webpack 对象。因此在大多数情况下，不建议在项目中额外安装 webpack 依赖。

如果是第二种情况，建议看看能否升级某个 npm 包，使其依赖的 webpack 版本范围与 Builder 保持一致。也可以通过包管理器的能力来手动统一版本，比如使用 [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 或 [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides)。

如果是第三种情况，可以使用第二种情况中提到的两种方法，也可以尝试删除 lock 文件后重新安装来解决。

:::tip
删除 lock 文件会使项目中的依赖版本自动升级到指定范围下的最新版，请进行充分的测试。
:::

## 编译产物中存在未编译的 ES6+ 代码？

默认情况下，Builder 不会通过 `babel-loader` 或 `ts-loader` 来编译 `node_modules` 下的文件。如果项目引入的 npm 包中含有 ES6+ 语法，会被打包进产物中。

遇到这种情况时，可以通过 [source.include](/zh/api/config-source.html#source-include) 配置项来指定需要额外进行编译的目录或模块。

## 在 Monorepo 中引用其他模块，代码没有被正确编译？

出于编译性能的考虑，默认情况下，Builder 不会通过 `babel-loader` 或 `ts-loader` 来编译 `node_modules` 下的文件，也不会编译当前工程目录外部的文件。

通过 `source.include` 配置项，可以指定需要额外进行编译的目录或模块。

详见 [source.include 用法介绍](/zh/api/config-source.html#source-include)。

## 编译时报错 `You may need additional loader`？

如果编译过程中遇到了以下报错提示，表示存在个别文件无法被正确编译。

```bash
Module parse failed: Unexpected token
File was processed with these loaders:
 * some-loader/index.js

You may need an additional loader to handle the result of these loaders.
```

解决方法：

- 如果是引用了当前工程外部的 `.ts` 文件，或者是 node_modules 下的 `.ts` 文件，请添加 [source.include](/zh/api/config-source.html#source-include) 配置项，指定需要额外进行编译的文件。
- 如果是引用了 Builder 不支持的文件格式，请自行配置对应的 webpack loader 进行编译。

## 打开页面后报错，提示 exports is not defined？

如果编译正常，但是打开页面后出现 `exports is not defined` 报错，通常是因为在项目中使用 babel 编译了一个 CommonJS 模块，导致 babel 出现异常。

在正常情况下，Builder 是不会使用 babel 来编译 CommonJS 模块的。如果项目中使用了 [source.include]() 配置项，或使用了 [tools.babel](/zh/api/config-tools.html#tools-babel) 的 `addIncludes` 方法，则可能会把一些 CommonJS 模块加入到 babel 编译中。

该问题有两种解决方法：

1. 避免将 CommonJS 模块加入到 babel 编译中。
2. 将 babel 的 `sourceType` 配置项设置为 `unambiguous`，示例如下：

```js
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

将 `sourceType` 设置为 `unambiguous` 可能会产生一些其他影响，请参考 [babel 官方文档](https://babeljs.io/docs/en/options#sourcetype)。

## 热更新后 React 组件的 state 丢失？

Builder 使用 React 官方的 [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) 能力来进行组件热更新。

在使用 Fast Refresh 时，要求组件不能为匿名函数，否则热更新后无法保留 React 组件的 state。

以下写法都是不正确的：

```js
// 错误写法 1
export default function () {
  return <div>Hello World</div>;
}

// 错误写法 2
export default () => <div>Hello World</div>;
```

正确的写法为：

```js
// 正确写法 1
export default function MyComponent() {
  return <div>Hello World</div>;
}

// 正确写法 2
const MyComponent = () => <div>Hello World</div>

export default MyComponent;
```

## webpack 编译缓存未生效，应该如何排查？

Builder 默认开启了 webpack 的持久化缓存。

首次编译完成后，会自动生成缓存文件，并输出到 `./node_modules/.cache/webpack` 目录下。执行第二次编译时，会命中缓存，并大幅度提高编译速度。

当 `package.json` 等配置文件被修改时，缓存会自动失效。

如果项目中 webpack 编译缓存一直未生效，可以添加以下配置进行排查：

```ts
export default {
  tools: {
    webpack(config) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        debug: true,
      };
    },
  },
};
```

添加以上配置后，webpack 会输出日志用于 debug，请参考 `PackFileCacheStrategy` 相关的日志来了解缓存失效的原因。

## 打包后发现 Tree Shaking 没有生效？

Builder 在生产构建时会默认开启 webpack 的 Tree Shaking 功能，Tree Shaking 是否能够生效，取决于业务代码能否满足 webpack 的 Tree Shaking 条件。

如果你遇到了 Tree Shaking 不生效的问题，可以检查下相关 npm 包的 `sideEffects` 配置是否正确，如果不了解 `sideEffects` 是什么，可以阅读以下两篇文档：

- [webpack 官方文档 - Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/)
- [Tree Shaking 问题排查指南](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

## 打包时出现 JavaScript heap out of memory?

该报错表示打包过程中出现了内存溢出问题，大多数情况下是由于打包的内容较多，超出了 Node.js 默认的内存上限。

如果出现 OOM 问题，最简单的方法是通过增加内存上限来解决，Node.js 提供了 `--max-old-space-size` 选项来对此进行设置。你可以在 CLI 命令前添加 [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions) 来设置此参数：

```bash
NODE_OPTIONS=--max_old_space_size=16384 modern build
```

参数的值代表内存上限大小（MB)，一般情况下设置为 `16384`（16GB）即可。

Node.js 官方文档中有对以下参数更详细的解释：

- [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions)
- [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)

除了增加内存上限，通过开启一些编译策略来提升效率也是一个解决方案。

## Less 文件中的除法不生效？

Less v4 版本与 v3 版本相比，除法的写法有一些区别：

```less
// Less v3
.math {
  width: 2px / 2; // 1px
  width: 2px ./ 2; // 1px
  width: (2px / 2); // 1px
}

// Less v4
.math {
  width: 2px / 2; // 2px / 2
  width: 2px ./ 2; // 1px
  width: (2px / 2); // 1px
}
```

Builder 内置的 Less 版本为 v4，低版本的写法不会生效，请注意区分。

Less 中除法的写法也可以通过配置项来修改，详见 [Less - Math](https://lesscss.org/usage/#less-options-math)。
