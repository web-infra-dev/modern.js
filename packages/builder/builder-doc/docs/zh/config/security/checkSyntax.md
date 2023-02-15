- **类型：**

```ts
type CheckSyntax =
  | boolean
  | {
      targets: string[];
    };
```

- **默认值：** `false`
- **打包工具：** `仅支持 webpack`

分析构建产物中是否存在当前浏览器范围下不兼容的高级语法。如果存在，会将详细信息打印在终端。

### 示例

```ts
export default {
  security: {
    checkSyntax: true,
  },
};
```

如果将 `security.checkSyntax` 指定为 `true` 的话，则 targets 会被认定为项目设定的 browserslist，详情请参考 [设置浏览器范围](https://modernjs.dev/builder/guide/advanced/browser-compatibility.html)。

开启后将在生产环境下进行检测，当检测到不兼容的高级语法后，会将错误日志打印在终端，并退出当前构建流程。

### 错误日志

错误日志的格式如下所示，包含代码来源文件、产物位置、错误原因、源代码等信息：

```bash
error   [Syntax Checker] Find some syntax errors after production build:

  ERROR#1:
  source - /node_modules/foo/index.js:1:0
  output - /Project/dist/static/js/main.3f7a4d7e.js:2:39400
  reason - The keyword 'const' is reserved (2:39400)
  code   - const foo = 'bar';
```

### 解决方法

当检测到语法错误后，你可以通过以下方式来处理：

- 如果你希望降级该语法，以保证代码具备良好的兼容性，可以通过 `source.include` 配置来编译相应的模块。
- 如果你不希望降级该语法，可以调整项目的 browserslist 范围，调整至与该语法相匹配的范围。
