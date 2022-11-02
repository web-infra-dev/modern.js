---
sidebar_position: 1
---

# 编译构建问题

### 如何配置 Webpack/Babel/PostCSS 等工具？

请参考 [配置底层工具](/docs/guides/advanced-features/low-level)。

### 如何自定义 HTML 模板？

请参考 [自定义 HTML 模板](/docs/guides/basic-features/html)。

### 如何提升编译构建速度？

请参考 [提升编译速度](/docs/guides/topic-detail/compile-speed)。

### 如何查看最终生效的 webpack 配置？

可以通过 [modern inspect](/docs/apis/app/commands/inspect) 命令来查看最终生效的 webpack 配置。

---

### 如何配置组件库按需引入？

默认情况下，Modern.js 内置了 antd 组件库的按需引入配置。

如果需要配置其他组件库的按需引入，可以通过 [tools.babel](/docs/configure/app/tools/babel) 配置 [babel-plugin-import](https://github.com/umijs/babel-plugin-import) 插件。

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { addPlugins }) => {
      addPlugins([
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ]);
    },
  },
});
```

---

### 如何移除代码中的 console？

在生产环境构建时，我们可以移除代码中的 `console`，从而避免开发环境的日志被输出到生产环境。

由于 Modern.js 默认在生产环境使用 [terser](https://github.com/terser/terser) 进行代码压缩，因此我们可以通过 [tools.terser](/docs/configure/app/tools/terser) 配置项来移除 `console`：

```js title="modern.config.ts"
export default defineConfig({
  tools: {
    terser: opt => {
      if (typeof opt.terserOptions?.compress === 'object') {
        opt.terserOptions.compress.drop_console = true;
      }
    },
  },
});
```

如果只希望移除 `console.log` 和 `console.warn`，保留 `console.error`，可以配置为：

```js title="modern.config.ts"
export default defineConfig({
  tools: {
    terser: opt => {
      if (typeof opt.terserOptions?.compress === 'object') {
        opt.terserOptions.compress.pure_funcs = ['console.log', 'console.warn'];
      }
    },
  },
});
```

---

### 如何清空 webpack 编译缓存？

默认情况下，Modern.js 的 webpack 编译缓存生成在 `./node_modules/.cache/webpack` 目录下。

如果需要清空本地的编译缓存，可以执行以下命令：

```bash
rm -rf ./node_modules/.cache
```

---

### 如何配置静态资源的 CDN 路径？

如果需要将 JS、CSS 等静态资源上传到 CDN 使用，那么可以通过 [output.assetPrefix](/docs/configure/app/output/asset-prefix) 配置来设置静态资源的 URL 前缀。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
});
```

---

### 如何在编译过程中进行 ESLint 代码校验？

出于编译性能的考虑，Modern.js 默认不会在编译过程中进行 ESLint 校验，如果需要该功能，可以手动安装并注册社区中的 [eslint-webpack-plugin](https://github.com/webpack-contrib/eslint-webpack-plugin)。

注册该插件的示例代码如下，更详细的用法请参考 [eslint-webpack-plugin](https://github.com/webpack-contrib/eslint-webpack-plugin) 文档。

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';
import ESLintPlugin from 'eslint-webpack-plugin';

export default defineConfig({
  tools: {
    webpackChain(chain) {
      chain.plugin('eslint-plugin').use(ESLintPlugin, [
        {
          extensions: ['.js', '.ts', '.jsx', 'tsx', '.mjs'],
        },
      ]);
    },
  },
});
```

---

### 如何配置 SRI 校验？

在 Modern.js 中，需要自主引入社区中的 [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) 插件来开启 SRI 校验。

配置 [webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity) 的示例如下：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';
import { SubresourceIntegrityPlugin } from 'webpack-subresource-integrity';

export default defineConfig({
  tools: {
    webpackChain(chain) {
      chain.output.crossOriginLoading('anonymous');
      chain.plugin('subresource-integrity').use(SubresourceIntegrityPlugin);
    },
  },
});
```

:::info SRI
子资源完整性 Subresource Integrity（SRI）是专门用来校验资源的一种方案，它读取资源标签中的 integrity 属性，将其中的信息摘要值，和资源实际的信息摘要值进行对比，如果发现无法匹配，那么浏览器就会拒绝执行资源。

对于 script 标签来说，结果为拒绝执行其中的代码；对于 CSS link 来说，结果为不加载其中的样式。
:::

---

### Less/Sass 代码没有被正确编译？

Modern.js 通过插件来编译 Less/Sass 代码，请确认你是否启用了对应的插件。

- [启用 Less 插件教程](/docs/configure/app/tools/less#启用)
- [启用 Sass 插件教程](/docs/configure/app/tools/sass#启用)

---

### 在 Monorepo 中引用其他模块，代码没有被正确编译？

出于编译性能的考虑，默认情况下，Modern.js 不会通过 `babel-loader` 或 `ts-loader` 来编译 `node_modules` 下的文件，也不会编译当前工程目录外部的文件。

通过 `source.include` 配置项，可以指定需要额外进行编译的目录或模块。

详见 [source.include 用法介绍](/docs/configure/app/source/include/)。

---

### 打包时出现 JavaScript heap out of memory?

该报错表示打包过程中出现了内存溢出问题，大多数情况下是由于打包的内容较多，超出了 Node.js 默认的内存上限。

如果出现 OOM 问题，最简单的方法是通过增加内存上限来解决，Node.js 提供了 `--max-old-space-size` 选项来对此进行设置。你可以在 `modern build` 命令前添加 [NODE_OPTIONS](http://nodejs.cn/api/cli/node_options_options.html) 来设置此参数：

```bash
NODE_OPTIONS=--max_old_space_size=16384 modern build
```

参数的值代表内存上限大小（MB)，一般情况下设置为 `16384`（16GB）即可。

Node.js 官方文档中有对以下参数更详细的解释：

- [NODE_OPTIONS](http://nodejs.cn/api/cli/node_options_options.html)
- [--max-old-space-size](http://nodejs.cn/api/cli/max_old_space_size_size_in_megabytes.html)

除了增加内存上限，通过开启一些编译策略来提升效率也是一个解决方案，详见 [提升编译速度](/docs/guides/topic-detail/compile-speed)。

---

### webpack 编译出现 'compilation' argument 报错？

如果编译时出现以下报错，通常是由于项目中安装了错误的 webpack 版本，或者安装了多个 webpack 版本引起：

```bash
TypeError: The 'compilation' argument must be an instance of Compilation
```

webpack 版本问题有以下几种情况：

1. 项目的 package.json 中直接声明了 webpack 依赖，并且与 Modern.js 依赖的 webpack 版本范围不同，无法匹配到同一个版本。
2. 项目里安装的多个 npm 包都依赖了 webpack，并且它们依赖的 webpack 版本范围不同，无法匹配到同一个版本。
3. 由于包管理器的 lock 机制，导致 lock 文件中产生了多个 webpack 版本。

如果是第一种情况，建议从项目的 package.json 中移除 webpack 依赖。因为 Modern.js 默认封装了 webpack 相关能力，并且会在 `tools.webpack` 配置项中传入 webpack 对象。因此在大多数情况下，不建议在项目中额外安装 webpack 依赖。

如果是第二种情况，建议看看能否升级某个 npm 包，使其依赖的 webpack 版本范围与 Modern.js 保持一致。也可以通过包管理器的能力来手动统一版本，比如使用 [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 或 [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides)。

如果是第三种情况，可以使用第二种情况中提到的两种方法，也可以尝试删除 lock 文件后重新安装来解决。

:::info
删除 lock 文件会使项目中的依赖版本自动升级到指定范围下的最新版，请进行充分的测试。
:::

---

### Less 文件中的除法不生效？

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

Modern.js 内置的 Less 版本为 v4，低版本的写法不会生效，请注意区分。

Less 中除法的写法也可以通过配置项来修改，详见 [Less - Math](https://lesscss.org/usage/#less-options-math)。

---

### 编译产物中存在未编译的 ES6+ 代码？

默认情况下，Modern.js 不会通过 `babel-loader` 或 `ts-loader` 来编译 `node_modules` 下的文件。如果项目引入的 npm 包中含有 ES6+ 语法，会被打包进产物中。

遇到这种情况时，可以通过 [source.include](/docs/configure/app/source/include) 配置项来指定需要额外进行编译的目录或模块。

---

### 编译时报错 `You may need additional loader`？

如果编译过程中遇到了以下报错提示，表示存在个别文件无法被正确编译。

```bash
Module parse failed: Unexpected token
File was processed with these loaders:
 * some-loader/index.js

You may need an additional loader to handle the result of these loaders.
```

解决方法：

- 如果是引用了当前工程外部的 `.ts` 文件，或者是 node_modules 下的 `.ts` 文件，请添加 [source.include](/docs/configure/app/source/include) 配置项，指定需要额外进行编译的文件。
- 如果是引用了 Modern.js 不支持的文件格式，请自行配置对应的 webpack loader 进行编译。

---

### 打开页面后报错，提示 exports is not defined？

如果编译正常，但是打开页面后出现 `exports is not defined` 报错，通常是因为在项目中使用 babel 编译了一个 CommonJS 模块，导致 babel 出现异常。

在正常情况下，Modern.js 是不会使用 babel 来编译 CommonJS 模块的。如果项目中使用了 `source.include` 配置项，或使用了 `tools.babel` 的 `addIncludes` 方法，则可能会把一些 CommonJS 模块加入到 babel 编译中。

该问题有两种解决方法：

1. 避免将 CommonJS 模块加入到 babel 编译中。
2. 将 babel 的 `sourceType` 配置项设置为 `unambiguous`，示例如下：

```js
export default defineConfig({
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
});
```

将 `sourceType` 设置为 `unambiguous` 可能会产生一些其他影响，请参考 [babel 官方文档](https://babeljs.io/docs/en/options#sourcetype)。

---

### 打包后发现 Tree Shaking 没有生效？

Modern.js 在生产构建时会默认开启 webpack 的 Tree Shaking 功能，Tree Shaking 是否能够生效，取决于业务代码能否满足 webpack 的 Tree Shaking 条件。

如果你遇到了 Tree Shaking 不生效的问题，可以检查下相关 npm 包的 `sideEffects` 配置是否正确，如果不了解 `sideEffects` 是什么，可以阅读以下两篇文档：

- [webpack 官方文档 - Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/)
- [Tree Shaking 问题排查指南](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

---

### 热更新后 React 组件的 state 丢失？

Modern.js 使用 React 官方的 [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) 能力来进行组件热更新。

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

---

### webpack 编译缓存未生效，应该如何排查？

Modern.js 默认开启了 webpack 的持久化缓存。

首次编译完成后，会自动生成缓存文件，并输出到 `./node_modules/.cache/webpack` 目录下。执行第二次编译时，会命中缓存，并大幅度提高编译速度。

当 `modern.config.ts` 或 `package.json` 等配置文件被修改时，缓存会自动失效。

如果项目中 webpack 编译缓存一直未生效，可以添加以下配置进行排查：

```ts
export default defineConfig({
  tools: {
    webpack(config) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        debug: true,
      };
    },
  },
});
```

添加以上配置后，webpack 会输出日志用于 debug，请参考 `PackFileCacheStrategy` 相关的日志来了解缓存失效的原因。
