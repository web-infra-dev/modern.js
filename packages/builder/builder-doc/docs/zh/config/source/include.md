- **类型：** `Array<string | RegExp>`
- **默认值：** `[]`

出于编译性能的考虑，默认情况下，Builder 不会编译 node_modules 下的 JavaScript/TypeScript 文件，也不会编译当前工程目录外部的 JavaScript/TypeScript 文件。

通过 `source.include` 配置项，可以指定需要 Builder 额外进行编译的目录或模块。`source.include` 的用法与 webpack 中的 [Rule.include](https://webpack.js.org/configuration/module/#ruleinclude) 一致，支持传入字符串或正则表达式来匹配模块的路径。

比如:

```js
import path from 'path';

export default {
  source: {
    include: [path.resolve(__dirname, '../other-dir')],
  },
};
```

### 编译 npm 包

比较典型的使用场景是编译 node_modules 下的 npm 包，因为某些第三方依赖存在 ES6+ 的语法，这可能导致在低版本浏览器上无法运行，你可以通过该选项指定需要编译的依赖，从而解决此类问题。

以 `query-string` 为例，你可以做如下的配置：

```js
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
      // 所有包含 `/query-string/` 的路径都会被匹配到
      /\/query-string\//,
    ],
  },
};
```

### 编译 npm 包的子依赖

当你通过 `source.include` 编译一个 npm 包时，Builder 默认只会编译匹配到的模块，不会编译对应模块的**子依赖**。

以 `query-string` 为例，它依赖的 `decode-uri-component` 包中同样存在 ES6+ 代码，因此需要将 `decode-uri-component` 也加入到 `source.include` 中：

```js
import path from 'path';

export default {
  source: {
    include: [/\/query-string\//, /\/decode-uri-component\//],
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
