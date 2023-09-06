- **类型：**

```ts
type CheckSyntax =
  | boolean
  | {
      targets?: string[];
      exclude?: RegExp | RegExp[];
      ecmaVersion?: EcmaVersion;
    };
```

- **默认值：** `false`

用于分析构建产物中是否存在当前浏览器范围下不兼容的高级语法。如果存在，会将详细信息打印在终端。

### 启用检测

你可以将 `checkSyntax` 设置为 `true` 来启用语法检测。

```ts
export default {
  security: {
    checkSyntax: true,
  },
};
```

当你开启 `checkSyntax` 后，Builder 会在生产环境构建时进行检测，当在构建产物中检测到不兼容的高级语法后，会将错误日志打印在终端，并退出当前构建流程。

### 错误日志

错误日志的格式如下所示，包含代码来源文件、产物位置、错误原因、源代码等信息：

```bash
error   [Syntax Checker] Find some syntax errors after production build:

  Error 1
  source:  /node_modules/foo/index.js:1:0
  output:  /dist/static/js/main.3f7a4d7e.js:2:39400
  reason:  Unexpected token (1:178)
  code:
     9 |
    10 | var b = 2;
    11 |
  > 12 | console.log(() => {
    13 |   return a + b;
    14 | });
    15 |
```

:::tip
目前语法检测是基于 AST parser 来实现的，每次检测时，只能找出文件中的第一个不兼容语法。如果一个文件中存在多个不兼容语法，你需要修复已发现的语法，并重新执行检测。
:::

### 解决方法

当检测到语法错误后，你可以通过以下方式来处理：

- 如果你希望降级该语法，以保证代码具备良好的兼容性，可以通过 `source.include` 配置来编译相应的模块。
- 如果你不希望降级该语法，可以调整项目的 browserslist 范围，调整至与该语法相匹配的范围。
- 如果你不希望对某些产物进行语法检查，可用 `checkSyntax.exclude` 配置排除要检查的文件。

### 配置项

#### checkSyntax.targets

- **类型：** `string[]`
- **默认值：** `当前项目的 browserslist 配置`

`targets` 表示项目的目标浏览器范围，它的值为标准的 browserslist 数组，如果你不了解 browserslist 的用法，请参考 [「设置浏览器范围」](https://modernjs.dev/builder/guide/advanced/browser-compatibility.html)。

Builder 会读取 `targets` 的值，并自动推导出构建产物中可以使用的最低 ECMAScript 语法版本，比如 `ES5` 或 `ES6`。

- **示例：**

比如，项目中需要兼容的浏览器为 Chrome 53 以上版本，可以添加以下设置：

```ts
export default {
  security: {
    checkSyntax: {
      targets: ['chrome >= 53'],
    },
  },
};
```

Builder 会推导出 `chrome >= 53` 可以使用的 ECMAScript 语法版本为 `ES6`，当构建产物中包含 `es2016` 或更高的语法时，就会触发语法错误提示。

:::tip
请留意，Builder 不支持基于 `targets` 来自动分析 ES6 以上的语法版本，如果你的构建产物兼容的语法版本超过 ES6，请通过 `checkSyntax.ecmaVersion` 进行设置。
:::

#### checkSyntax.ecmaVersion

- **类型：** `3 | 5 | 6 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 'latest'`
- **默认值：** `基于 targets 自动分析`

`ecmaVersion` 表示构建产物中可以使用的最低 ECMAScript 语法版本，`ecmaVersion` 的优先级高于 `targets`。

- **示例：**

比如，构建产物中可以使用的最低 ECMAScript 语法版本为 `ES2020`，可以添加以下设置：

```ts
export default {
  security: {
    checkSyntax: {
      ecmaVersion: 2020,
    },
  },
};
```

此时，构建产物中可以包含 `ES2020` 支持的所有语法，比如 optional chaining。

#### checkSyntax.exclude

- **类型：** `RegExp | RegExp[]`
- **默认值：** `undefined`

`exclude` 用于在检测时排除一部分文件，你可以传入一个或多个正则表达式来匹配源文件的路径，符合正则的文件将会被忽略，不会触发语法检测。

- **示例：**

比如，忽略 `node_modules/foo` 目录下的文件：

```ts
export default {
  security: {
    checkSyntax: {
      exclude: /node_modules\/foo/,
    },
  },
};
```
