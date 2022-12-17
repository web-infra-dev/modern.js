# 引用样式资源

Builder 内置多种常用的样式资源处理方式，包括 Less / Sass 预处理器、PostCSS、CSS Modules、CSS 内联和 CSS 压缩。

除此之外，Builder 也提供了多个配置项来自定义样式资源的处理规则。

## 使用 CSS Modules

[CSS Modules](https://github.com/css-modules/css-modules) 让我们能以模块化的方式编写 CSS 代码，并且可以在 JavaScript 文件中导入和使用这些样式。使用 CSS Modules 可以自动生成唯一的类名，隔离不同模块之间的样式，避免类名冲突。

Builder 默认支持使用 CSS Modules，无需添加额外的配置。我们约定使用 `[name].module.css` 文件名来启用 CSS Modules。

以下样式文件会被视为 CSS Modules：

- `*.module.scss`
- `*.module.less`
- `*.module.css`

### 示例

- 编写样式：

```css
/* button.module.css */
.error {
  background: red;
}
```

- 使用样式：

```tsx
// Button.tsx
import React, { Component } from 'react';
// 引入样式文件
import styles from './button.module.css';

export default () => {
  return <button className={styles.error}>Error Button</button>;
};
```

### 为所有样式文件启用 CSS Modules

在默认情况下，只有 `*.module.css` 结尾的文件才被视为 CSS Modules 模块。

如果你想将源码目录下的所有 CSS 文件当做 CSS Modules 模块进行处理，可以通过开启 [output.disableCssModuleExtension](/zh/api/config-output.html#output-disablecssmoduleextension) 来实现，比如：

```ts
export default {
  output: {
    disableCssModuleExtension: true,
  },
};
```

设置后，以下两个文件都会被视为 CSS Modules：

```ts
import styles1 from './foo.module.css';
import styles2 from './bar.css';
```

:::tip
我们不推荐开启此配置项，因为开启 `disableCssModuleExtension` 后，CSS Modules 文件和普通 CSS 文件无法得到明确的区分，不利于长期维护。
:::

### 自定义类名

自定义 CSS Modules 生成的类名也是我们比较常用的功能，你可以使用 [output.cssModuleLocalIdentName](/zh/api/config-output.html#output-cssmodulelocalidentname) 来进行配置。

```ts
export default {
  output: {
    cssModuleLocalIdentName: '[hash:base64:4]',
  },
};
```

如果你需要自定义 CSS Modules 的其他配置，可以通过 [tools.cssLoader](/zh/api/config-tools.html#css-loader) 进行设置。

## 使用 Less 和 Sass

Builder 内置了社区流行的 CSS 预处理器，包括 Less 和 Sass。

你可以通过配置 [tools.less](/zh/api/config-tools.html#tools-less)、[tools.sass](/zh/api/config-tools.html#tools-sass) 来自定义相关 loader。

## 使用 PostCSS

Builder 内置了 [PostCSS](https://postcss.org/) 来转换 CSS 代码。

你可以通过 [tools.postcss](/zh/api/config-tools.html#tools-postcss) 来配置 postcss-loader。

在默认情况下，我们开启了 [autoprefixer](https://github.com/postcss/autoprefixer) 来自动补齐 CSS 的浏览器前缀。如果你需要配置目标浏览器，可使用 [output.overrideBrowserslist](/zh/api/config-output.html#output-overridebrowserslist) 进行配置。

## CSS 压缩

通常情况下，在生产环境我们会将 CSS、JS 等静态资源进行压缩，以达到更好的传输效率。Builder 通过 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 在生产环境构建时自动压缩 CSS 代码。

你可以通过配置 [tools.minifyCss](/zh/api/config-tools.html#tools-minifycss) 来对它进行更自定义的配置。

## 内联 CSS 文件

默认情况下，Builder 会把 CSS 提取为独立的 `.css` 文件，并输出到构建产物目录。

如果你希望将样式内联到 JS 文件中，可以将 [output.disableCssExtract](/zh/api/config-output.html#output-disablecssextract) 设置为 `true` 来禁用 CSS 提取逻辑。当浏览器请求到 JS 文件后，JS 将动态地向 HTML 插入 `<style>` 标签，以此加载 CSS 样式。

这将会增大你的 JS Bundle 体积，因此通常情况下，不太建议禁用 CSS 提取逻辑。

## 引用 node_modules 里的样式

你可以直接引用 node_modules 里的样式文件。

- 在组件中引用：

```ts
// src/App.tsx
// 引用 Arco Design 样式：
import "@arco-design/web-react/dist/css/arco.css";
```

- 在样式文件中引用：

```css
/* src/App.css */
/* 引用 normalize.css */
/* https://github.com/necolas/normalize.css */
@import 'normalize.css';

body {
  /* */
}
```
