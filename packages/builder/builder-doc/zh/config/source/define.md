- Type: `Record<string, unknown>`
- Default: `{}`

构建时将代码中的变量替换成其它值或者表达式，可以用于在代码逻辑中区分开发环境与生产环境等场景。

传入的配置对象的键名是需要替换变量的名称，或者是用 `.` 连接的多个标识符，配置项的值则根据类型进行不同的处理：

- 字符串会被当作代码片段。
- 包括函数在内的其他类型会被转换成字符串。
- 嵌套对象的父子键名之间会用 `.` 连接作为需要替换的变量名。
- 以 typeof 开头的键名会用来替换 typeof 调用。

更多细节参考 [https://webpack.js.org/plugins/define-plugin/](https://webpack.js.org/plugins/define-plugin/)。

#### 示例

```js
export default {
  source: {
    define: {
      PRODUCTION: JSON.stringify(true),
      VERSION: JSON.stringify('5fa3b9'),
      BROWSER_SUPPORTS_HTML5: true,
      TWO: '1 + 1',
      'typeof window': JSON.stringify('object'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'import.meta': { test: undefined },
    }
  }
}
```

表达式会被替换为对应的代码段：

```js
const foo = TWO;

// ⬇️ Turn into being...
const foo = 1 + 1;
```
