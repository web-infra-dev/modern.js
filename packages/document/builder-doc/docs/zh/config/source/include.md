- **类型：** `Array<string | RegExp>`
- **默认值：** `[]`
- **打包工具：** `仅支持 webpack`

出于编译性能的考虑，默认情况下，Builder 不会编译 node_modules 下的 JavaScript/TypeScript 文件，也不会编译当前工程目录外部的 JavaScript/TypeScript 文件。

通过 `source.include` 配置项，可以指定需要 Builder 额外进行编译的目录或模块。`source.include` 的用法与 webpack 中的 [Rule.include](https://webpack.js.org/configuration/module/#ruleinclude) 一致，支持传入字符串或正则表达式来匹配模块的路径。

比如:

```ts
import path from 'path';

export default {
  source: {
    include: [path.resolve(__dirname, '../other-dir')],
  },
};
```

:::tip
在使用 Rspack 作为打包工具时，默认**所有文件**都会经过编译，同时，不支持通过 `source.exclude` 排除。
:::

### 编译 npm 包

比较典型的使用场景是编译 node_modules 下的 npm 包，因为某些第三方依赖存在 ES6+ 的语法，这可能导致在低版本浏览器上无法运行，你可以通过该选项指定需要编译的依赖，从而解决此类问题。

以 `query-string` 为例，你可以做如下的配置：

```ts
import path from 'path';

export default {
  source: {
    include: [
      // 方法一:
      // 先通过 require.resolve 来获取模块的路径
      // 再通过 path.dirname 来指向对应的目录
      path.dirname(require.resolve('query-string')),
      // 方法二:
      // 通过正则表达式进行匹配
      // 所有包含 `/node_modules/query-string/` 的路径都会被匹配到
      /\/node_modules\/query-string\//,
    ],
  },
};
```

上述两种方法分别通过 "路径前缀" 和 "正则表达式" 来匹配文件的绝对路径，值得留意的是，项目中所有被引用的模块都会经过匹配，因此你不能使用过于松散的值进行匹配，避免造成编译性能问题或编译异常。

### 编译 npm 包的子依赖

当你通过 `source.include` 编译一个 npm 包时，Builder 默认只会编译匹配到的模块，不会编译对应模块的**子依赖**。

以 `query-string` 为例，它依赖的 `decode-uri-component` 包中同样存在 ES6+ 代码，因此你需要将 `decode-uri-component` 也加入到 `source.include` 中：

```ts
export default {
  source: {
    include: [
      /\/node_modules\/query-string\//,
      /\/node_modules\/decode-uri-component\//,
    ],
  },
};
```

### 编译 Monorepo 中的其他库

在 Monorepo 中进行开发时，如果需要引用 Monorepo 中其他库的源代码，也可以直接在 `source.include` 进行配置:

```ts
import path from 'path';

export default {
  source: {
    include: [
      // 方法一:
      // 编译 Monorepo 的 package 目录下的所有文件
      path.resolve(__dirname, '../../packages'),

      // 方法二:
      // 编译 Monorepo 的 package 目录里某个包的源代码
      // 这种写法匹配的范围更加精准，对整体编译性能的影响更小
      path.resolve(__dirname, '../../packages/xxx/src'),
    ],
  },
};
```

### 编译 CommonJS 模块

Babel 默认无法编译 CommonJS 模块，如果你编译了一个 CommonJS 模块，可能会出现 `exports is not defined` 的运行时报错信息。

当你需要使用 `source.include` 来编译 CommonJS 模块时，可以将 Babel 的 `sourceType` 配置设置为 `unambiguous`：

```ts
export default {
  tools: {
    babel(config) {
      config.sourceType = 'unambiguous';
    },
  },
};
```

将 `sourceType` 设置为 `unambiguous` 可能会产生一些其他影响，请参考 [Babel 官方文档](https://babeljs.io/docs/en/options#sourcetype)。

### 匹配 Symlink

如果你匹配的模块是通过 symlink 链接到当前项目中的，那么需要匹配这个模块的**真实路径**，而不是 symlink 后的路径。

比如，你将 Monorepo 中的 `packages/foo` 路径 symlink 到当前项目的 `node_modules/foo` 路径下，则需要去匹配 `packages/foo` 路径，而不是 `node_modules/foo` 路径。

该行为可以通过 webpack 的 [resolve.symlinks](https://webpack.js.org/configuration/resolve/#resolvesymlinks) 配置项来进行控制。

### 注意事项

注意，`source.include` 不应该被用于编译整个 `node_modules` 目录，比如下面的写法是错误的：

```ts
export default {
  source: {
    include: [/\/node_modules\//],
  },
};
```

如果你对整个 `node_modules` 进行编译，不仅会使编译时间大幅度增加，并且可能会产生不可预期的错误。因为 `node_modules` 中的大部分 npm 包发布的已经是编译后的产物，通常没必要经过二次编译。此外，`core-js` 等 npm 包被编译后可能会出现异常。
