- Type: `Array<string | RegExp>`
- Default: `[]`

出于编译性能的考虑，默认情况下，Builder 不会编译 node_modules 下的 JavaScript/TypeScript 文件，也不会编译当前工程目录外部的 JavaScript/TypeScript 文件。

通过 `source.include` 配置项，可以指定需要额外进行编译的目录或模块。用法与 webpack 中的 [Rule.include](https://webpack.js.org/configuration/module/#ruleinclude) 一致，支持传入字符串或正则表达式来匹配模块的路径。

比如:

```js
import path from 'path';

export default {
  source: {
    include: [path.resolve(__dirname, '../other-dir')],
  },
};
```

### 场景示例

比较典型的使用场景是编译 node_modules 下的文件，因为某些第三方依赖存在 ES6+ 的语法，这可能导致在低版本浏览器上无法运行，你可以通过该选项指定需要编译的依赖，从而解决此类问题。以 `query-string` 为例，你可以做如下的配置：

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

> 注意，该配置只会编译 `query-string` 自身的代码，不会编译 `query-string` 的**子依赖**。如果需要编译 `query-string` 的子依赖，则需要将对应的 npm 包也加入到 `source.include` 中。

### Monorepo 项目

使用 Monorepo 时，如果需要引用 Monorepo 中其他库的源代码，也可以直接在 `source.include` 进行配置:

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

### 注意事项

注意，Babel 默认无法编译 CommonJS 模块，当你使用 `source.include` 来编译 CommonJS 模块时，需要将 Babel 的 `sourceType` 配置设置为 `unambiguous`：

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
