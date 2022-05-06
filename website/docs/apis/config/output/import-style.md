---
sidebar_label: importStyle
---

# output.importStyle

:::info 适用的工程方案
* 模块
:::


* 类型： `'compiled-code'` | `'source-code'`
* 默认值： `'source-code'`


通过该配置可以决定是否编译 `src` 目录下的样式代码。

默认情况下，对 `src` 目录下的样式代码不会做编译处理。对于在 JS(X)、TS(X) 文件中导入样式的路径，在构建之后路径会指向位于 `dist/js/styles` 目录下未处理的样式文件。

如果配置 `'compiled-code'`，则会对 `src` 目录下的样式代码进行编译处理，并且在 JS(X)、TS(X) 文件中导入编译后的 CSS 样式文件的路径。

假如一个可复用模块项目有以下文件：

- `./src/index.tsx`
- `./src/index.less`

:::info 注
假设开启了处理 Less 的功能。
:::

并且在 `./src/index.tsx` 文件中有以下代码：

``` tsx
import './index.less';
```

那么在默认情况下，在执行构建命令构建成功之后会看到如下构建产物：

- `./dist/js/styles/index.less`
- `./dist/js/modern/index.js`

:::info 补充信息
`./dist/js/modern` 为构建 JS(X)、TS(X) 的构建产物目录，除了这个目录以外，还有 `./dist/js/node`、`./dist/js/treeshaking`，想要了解更多，可以阅读 [packageMode](/docs/apis/config/output/package-mode) API 内容。
:::

其中 `./dist/js/modern/index.js` 文件内容为：

``` jsx
import '../styles/index.less';
```

而当设置了 `compiled-code` 配置后，执行构建命令之后会看到如下构建产物：

- `./dist/js/styles/index.css`
- `./dist/js/modern/index.js`

其中 `./dist/js/styles/index.css` 为编译处理 `./src/index.less` 文件后的 CSS 产物文件。

而 `./dist/js/modern/index.js` 文件的内容为：

``` jsx
import '../styles/index.css';
```
