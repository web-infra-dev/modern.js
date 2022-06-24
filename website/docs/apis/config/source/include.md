---
sidebar_label: include
sidebar_position: 5
---

# source.include

:::info 适用的工程方案
MWA。
:::

- 类型： `Array<string | RegExp>`
- 默认值： `[]`

默认情况下，Modern.js 不会通过 `babel-loader` 或 `ts-loader` 来编译 `node_modules` 下的文件，也不会编译当前工程目录外部的文件。

通过 `source.include` 配置项，可以指定需要额外进行编译的目录或模块。

## 用法介绍

`source.include` 的用法与 webpack 中的 [Rule.include](https://webpack.js.org/configuration/module/#ruleinclude) 用法一致，支持传入字符串或正则表达式来匹配模块的路径。

```js title="modern.config.js"
import path from 'path';

export default defineConfig({
  source: {
    include: [
      // 匹配以 `app/styles` 开头的模块路径。
      // 比如 `app/styles.css`, `app/styles/styles.css`, `app/stylesheet.css`
      path.resolve(__dirname, 'app/styles'),
      // 通常会添加一个额外的 `/` 号，从而精确匹配到目录的内容。
      path.join(__dirname, 'vendor/styles/'),
      // 通过正则来匹配某个目录，路径分隔符需要写成 `\/`
      /foo\/bar\//,
    ],
  },
});
```

## 编译 node_modules

当项目中使用了只提供 ES6+ 语法代码的第三方依赖时，可能导致在低版本浏览器上无法运行。可以通过该选项指定需要编译的依赖来解决此问题。

以 `query-string` 为例，可通过该选项指定 `query-string` 包：

```js title="modern.config.js"
export default defineConfig({
  source: {
    include: [
      // 通过 require.resolve 来获取模块的路径
      require.resolve('query-string'),
      // 也可以通过正则表达式进行匹配
      /\/query-string\//,
    ],
  },
});
```

## Monorepo 场景

使用 Monorepo 时，如果需要引用 Monorepo 中其他库的源代码，也可以直接在应用编译的过程中进行处理，只需要在这个选项中设置对应的包名或代码路径即可:

```js title="modern.config.js"
export default defineConfig({
  source: {
    // 设置编译 Monorepo 下的 package
    include: [require.resolve('@custom/package-name')],
  },
});
```
