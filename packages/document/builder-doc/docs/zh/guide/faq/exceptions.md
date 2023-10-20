# 异常类问题

### webpack 编译出现 'compilation' argument 报错？

如果编译时出现以下报错，通常是由于项目中安装了错误的 webpack 版本，或者安装了多个 webpack 版本引起：

```bash
TypeError: The 'compilation' argument must be an instance of Compilation
```

webpack 版本问题有以下几种情况：

1. 项目的 package.json 中直接声明了 webpack 依赖，并且与 Builder 依赖的 webpack 版本范围不同，无法匹配到同一个版本。
2. 项目里安装的多个 npm 包都依赖了 webpack，并且它们依赖的 webpack 版本范围不同，无法匹配到同一个版本。
3. 由于包管理器的 lock 机制，导致 lock 文件中产生了多个 webpack 版本。

如果是第一种情况，建议从项目的 package.json 中移除 webpack 依赖。因为 Builder 默认封装了 webpack 相关能力，并且会在 [tools.webpack](/api/config-tools.html#toolswebpack) 配置项中传入 webpack 对象。因此在大多数情况下，不建议在项目中额外安装 webpack 依赖。

如果是第二种情况，建议看看能否升级某个 npm 包，使其依赖的 webpack 版本范围与 Builder 保持一致。也可以通过包管理器的能力来手动统一版本，比如使用 [yarn resolutions](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) 或 [pnpm overrides](https://pnpm.io/package_json#pnpmoverrides)。

如果是第三种情况，可以使用第二种情况中提到的两种方法，也可以尝试删除 lock 文件后重新安装来解决。

:::tip
删除 lock 文件会使项目中的依赖版本自动升级到指定范围下的最新版，请进行充分的测试。
:::

---

### 编译产物中存在未编译的 ES6+ 代码？

默认情况下，Builder 不会通过 `babel-loader` 或 `ts-loader` 来编译 `node_modules` 下的文件。如果项目引入的 npm 包中含有 ES6+ 语法，会被打包进产物中。

遇到这种情况时，可以通过 [source.include](/api/config-source.html#sourceinclude) 配置项来指定需要额外进行编译的目录或模块。

---

### 在 Monorepo 中引用其他模块，代码没有被正确编译？

出于编译性能的考虑，默认情况下，Builder 不会编译 `node_modules` 下的文件，也不会编译当前工程目录外部的文件。

因此，当你引用其他子项目的源代码时，可能会遇到类似 `You may need an additional loader to handle the result of these loaders.` 的报错。

这个问题有以下解决方法：

1. 你可以开启源码构建模式来编译 monorepo 中的其他子项目，参考[「源码构建模式」](/guide/advanced/source-build.html)。
2. 你可以添加 `source.include` 配置项，指定需要额外进行编译的目录或模块，参考 [source.include 用法介绍](/api/config-source.html#sourceinclude)。
3. 你可以预先构建需要引用的子项目，生成对应的构建产物，并在当前项目引用构建产物，而不是引用源代码。

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

- 如果是引用了当前工程外部的 `.ts` 文件，或者是 node_modules 下的 `.ts` 文件，请添加 [source.include](/api/config-source.html#sourceinclude) 配置项，指定需要额外进行编译的文件。
- 如果是引用了 Builder 不支持的文件格式，请自行配置对应的 webpack loader 进行编译。

---

### 编译时报错 `Error: [object Object] is not a PostCSS plugin` ?

目前，Modern.js 使用的是 v8 版本的 PostCSS。如果编译过程中遇到了 `Error: [object Object] is not a PostCSS plugin` 报错提示，通常是由于引用到了错误的 PostCSS 版本导致，常见的如 `cssnano` 中 `postcss` (peerDependencies) 版本不符合预期。

可以通过 `npm ls postcss` 查找 `UNMET PEER DEPENDENCY` 的依赖，然后在 package.json 中通过指定 PostCSS 版本等方式安装正确的依赖版本即可。

```
npm ls postcss

 ├─┬ css-loader@6.3.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
 ├─┬ css-minimizer-webpack-plugin@3.0.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
```

---

### 打开页面后报错，提示 exports is not defined？

如果编译正常，但是打开页面后出现 `exports is not defined` 报错，通常是因为在项目中使用 Babel 编译了一个 CommonJS 模块，导致 Babel 出现异常。

在正常情况下，Builder 是不会使用 Babel 来编译 CommonJS 模块的。如果项目中使用了 [source.include](/api/config-source.html#sourceinclude) 配置项，或使用了 [tools.babel](/api/config-tools.html#toolsbabel) 的 `addIncludes` 方法，则可能会把一些 CommonJS 模块加入到 Babel 编译中。

该问题有两种解决方法：

1. 避免将 CommonJS 模块加入到 Babel 编译中。
2. 将 Babel 的 `sourceType` 配置项设置为 `unambiguous`，示例如下：

```js
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

将 `sourceType` 设置为 `unambiguous` 可能会产生一些其他影响，请参考 [Babel 官方文档](https://babeljs.io/docs/en/options#sourcetype)。

---

### 编译时报错 "Error: ES Modules may not assign module.exports or exports.\*, Use ESM export syntax"？

如果编译时出现以下报错，通常也是因为在项目中使用 Babel 编译了一个 CommonJS 模块，解决方法与上述的 `exports is not defined` 问题一致。

```bash
Error: ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: 581
```

更多信息请参考 issue：[babel#12731](https://github.com/babel/babel/issues/12731)。

---

### 编译时报错 "export 'foo' (imported as 'foo') was not found in './utils'"？

如果编译的过程中出现此报错，说明代码中引用了一个不存在的导出。

比如以下例子，`index.ts` 中引用了 `utils.ts` 中的 `foo` 变量， 但 `utils.ts` 实际上只导出了 `bar` 变量。

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

在这种情况下，Builder 会抛出以下错误：

```bash
Compile Error:
File: ./src/index.ts
export 'foo' (imported as 'foo') was not found in './utils' (possible exports: bar)
```

当你遇到该问题时，首先需要检查相关代码里 import / export 的内容是否正确，并修正相关错误。

常见的错误写法有：

- 引入了不存在的变量：

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

- re-export 了一个类型，但是没有添加 `type` 修饰符，导致 babel 等编译工具无法识别到类型导出，导致编译异常。

```ts
// utils.ts
export type Foo = 'bar';

// index.ts
export { Foo } from './utils'; // 错误写法
export type { Foo } from './utils'; // 正确写法
```

在个别情况下，以上报错是由第三方依赖引入的，你无法直接修改它。此时，如果你确定该问题不影响你的应用，那么可以添加以下配置，将 `error` 日志修改为 `warn` 级别：

```ts
export default {
  tools: {
    webpackChain(chain) {
      chain.module.parser.merge({
        javascript: {
          exportsPresence: 'warn',
        },
      });
    },
  },
};
```

同时，你需要尽快联系第三方依赖的开发者来修复相应的问题。

> 你可以查看 webpack 的文档来了解 [module.parser.javascript.exportsPresence](https://webpack.js.org/configuration/module/#moduleparserjavascriptexportspresence) 的更多细节。

---

### 编译进度条卡死，但终端无 Error 日志？

当编译进度条卡死，但终端无 Error 日志时，通常是因为编译过程中出现了异常。在某些情况下，当 Error 被 webpack 或其他模块捕获后，错误日志不会被正确输出。最为常见的场景是 Babel 配置出现异常，抛出 Error 后被 webpack 捕获，而 webpack 在个别情况下吞掉了 Error。

**解决方法：**

如果你修改 Babel 配置后出现此问题，建议检查是否有以下错误用法：

1. 配置了一个不存在的 plugin 或 preset，可能是名称拼写错误，或是未正确安装。

```ts
// 错误示例
export default {
  tools: {
    babel(config, { addPlugins }) {
      // 该插件名称错误，或者未安装
      addPlugins('babel-plugin-not-exists');
    },
  },
};
```

2. 是否配置了多个 babel-plugin-import，但是没有在数组的第三项声明每一个 babel-plugin-import 的名称。

```ts
// 错误示例
export default {
  tools: {
    babel(config, { addPlugins }) {
      addPlugins([
        [
          'babel-plugin-import',
          { libraryName: 'antd', libraryDirectory: 'es' },
        ],
        [
          'babel-plugin-import',
          { libraryName: 'antd-mobile', libraryDirectory: 'es' },
        ],
      ]);
    },
  },
};
```

```ts
// 正确示例
export default {
  tools: {
    babel(config, { addPlugins }) {
      addPlugins([
        [
          'babel-plugin-import',
          { libraryName: 'antd', libraryDirectory: 'es' },
          'antd',
        ],
        [
          'babel-plugin-import',
          { libraryName: 'antd-mobile', libraryDirectory: 'es' },
          'antd-mobile',
        ],
      ]);
    },
  },
};
```

---

### webpack 编译缓存未生效，应该如何排查？

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
        debug: /webpack\.cache/,
      };
    },
  },
};
```

添加以上配置后，webpack 会输出日志用于 debug，请参考 `PackFileCacheStrategy` 相关的日志来了解缓存失效的原因。

---

### 打包后发现 tree shaking 没有生效？

Builder 在生产构建时会默认开启 webpack 的 tree shaking 功能，tree shaking 是否能够生效，取决于业务代码能否满足 webpack 的 tree shaking 条件。

如果你遇到了 tree shaking 不生效的问题，可以检查下相关 npm 包的 `sideEffects` 配置是否正确，如果你不了解 `sideEffects` 的作用，或是对 tree shaking 背后的原理感兴趣，可以阅读以下两篇文档：

- [webpack 官方文档 - Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/)
- [Tree Shaking 问题排查指南](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

如果你是 npm 包的开发者，可以阅读这篇文章：

- [如何编写一个友好支持 Tree-shaking 的库](https://zhuanlan.zhihu.com/p/594124786)

---

### 打包时出现 JavaScript heap out of memory?

该报错表示打包过程中出现了内存溢出问题，大多数情况下是由于打包的内容较多，超出了 Node.js 默认的内存上限。

如果出现 OOM 问题，最简单的方法是通过增加内存上限来解决，Node.js 提供了 `--max-old-space-size` 选项来对此进行设置。你可以在 CLI 命令前添加 [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions) 来设置此参数。

比如，在 `modern build` 命令前添加参数：

```diff title="package.json"
{
  "scripts": {
-   "build": "modern build"
+   "build": "NODE_OPTIONS=--max_old_space_size=16384 modern build"
  }
}
```

如果你执行的是其他命令，比如 `modern deploy`，请在对应的命令前添加参数。

`max_old_space_size` 参数的值代表内存上限大小（MB)，一般情况下设置为 `16384`（16GB）即可。

Node.js 官方文档中有对以下参数更详细的解释：

- [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions)
- [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)

除了增加内存上限，通过开启一些编译策略来提升构建效率也是一个解决方案，请参考 [提升构建性能](/guide/optimization/build-performance)。

如果以上方式无法解决你的问题，可能是项目中某些异常逻辑导致了内存非正常溢出。你可以排查近期的代码变更，定位问题的根因。如果无法定位，请联系我们进行排查。

---

### 打包时出现 Can't resolve 'core-js/modules/xxx.js'？

如果你在打包时出现了类似下面的报错，表示项目中的 [core-js](https://github.com/zloirock/core-js) 无法被正确引用。

```bash
Module not found: Can't resolve 'core-js/modules/es.error.cause.js'
```

通常来说，你无须在项目中安装 `core-js`，因为 Builder 已经内置了一份 `core-js` v3。

如果出现 `core-js` 找不到的报错，可能有以下几个原因：

1. 项目里覆盖了 Babel 配置的 `plugins`，导致内置的 `babelPluginLockCorejsVersion` 无法正确生效。这种情况将 `tools.babel` 更改为函数用法即可：

```ts
// 错误用法，会覆盖 Builder 默认的 Babel 插件
export default {
  tools: {
    babel: {
      plugins: ['babel-plugin-xxx'],
    },
  },
};

// 正确用法，在默认配置中新增一个插件，而非覆盖插件
export default {
  tools: {
    babel(config) {
      config.plugins.push('babel-plugin-xxx');
    },
  },
};
```

2. 项目里某一处代码依赖了 `core-js` v2 版本。这种情况通常需要你找出对应的代码，并升级其中的 `core-js` 到 v3 版本。
3. `node_modules` 中的某一个 npm 包引用了 `core-js`，但是没有在 `dependencies` 中声明 `core-js` 依赖。这种情况需要你在对应的 npm 包中声明 `core-js` 依赖，或者在项目根目录下安装一份 `core-js`。

---

### 从 lodash 中引用类型后出现编译报错？

当你的项目中安装了 `@types/lodash` 包时，你可能会从 `lodash` 中引用一些类型，比如引用 `DebouncedFunc` 类型：

```ts
import { debounce, DebouncedFunc } from 'lodash';
```

上述代码会在编译后产生如下报错：

```bash
SyntaxError: /project/src/index.ts: The 'lodash' method `DebouncedFunc` is not a known module.
Please report bugs to https://github.com/lodash/babel-plugin-lodash/issues.
```

这个问题的原因是 Builder 默认开启了 [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) 插件来优化 lodash 产物体积，但 Babel 无法区别「值」和「类型」，导致编译后的代码出现异常。

解决方法是使用 TypeScript 的 `import type` 语法，对 `DebouncedFunc` 类型进行显式声明：

```ts
import { debounce } from 'lodash';
import type { DebouncedFunc } from 'lodash';
```

:::tip
在任意情况下，我们都推荐使用 `import type` 来引用类型，这对于编译器识别类型会有很大帮助。
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

Builder 内置的 Less 版本为 v4，低版本的写法不会生效，请注意区分。

Less 中除法的写法也可以通过配置项来修改，详见 [Less - Math](https://lesscss.org/usage/#less-options-math)。

---

### 修改配置后，报错 ‘TypeError: Cannot delete property 'xxx' of #\<Object\>’

该报错表示在编译过程中对一个只读配置项进行了删除操作。通常情况下，我们不希望编译过程中的任何操作会直接对传入的配置进行修改，但难以限制底层插件（如 postcss-loader 等）的行为，如果出现该报错，请联系 Builder 开发者，我们需要对该配置进行单独处理。

同类型报错还有：

- 'TypeError: Cannot add property xxx, object is not extensible'
- 'TypeError: Cannot assign to read only property 'xxx' of object '#\<Object\>'
