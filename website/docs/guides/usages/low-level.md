---
title: 配置底层工具
sidebar_label: 配置底层工具
sidebar_position: 8
---


## 使用方式

Modern.js 内部默认集成了 [Babel](https://babeljs.io/)、[TypeScript](https://www.typescriptlang.org/)、[Webpack](https://webpack.js.org/)、[PostCSS](https://postcss.org/)、[Tailwind CSS](https://tailwindcss.com/) 等工具。通常情况下，默认配置能够满足大多业务开发需求。当有特殊需求时，可以通过底层配置来实现。

以配置 Webpack 为例，只需要在 `modern.config.js` 中添加 [`tools.webpack`](/docs/apis/config/tools/webpack) 即可：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    webpack: config => {

    }
  }
})
```

`tools` 命名空间下的配置都可以设置为 `Object` 或者 `Function`。

值为 `Object` 时，会与内部默认配置进行合并，具体合并策略参考对应的配置选项文档（见下表）。

值为 `Function` 时，第一个参数为内部的默认配置对象，可以直接修改这个对象不做返回，也可以返回一个新的对象或者合并后的对象作为最终结果。

## 底层配置明细

目前提供的底层配置如下表：

| 底层工具 | 配置   |
| -------- | --------- |
| DevServer | [tools.devServer](/docs/apis/config/tools/dev-server) |
| Babel | [tools.babel](/docs/apis/config/tools/babel)|
| styled-components | [tools.styledComponents](/docs/apis/config/tools/styled-components)|
| PostCSS | [tools.postcss](/docs/apis/config/tools/postcss)|
| Less | [tools.less](/docs/apis/config/tools/less) |
| Sass | [tools.sass](/docs/apis/config/tools/sass) |
| webpack | [tools.webpack](/docs/apis/config/tools/webpack)|
| Minify CSS | [tools.minifyCss](/docs/apis/config/tools/minify-css)|
| terser | [tools.terser](/docs/apis/config/tools/terser)|
| Lodash | [tools.lodash](/docs/apis/config/tools/lodash)|
| Tailwind CSS | [tools.tailwind](/docs/apis/config/tools/tailwindcss) |
| Autoprefixer | [tools.autoprefixer](/docs/apis/config/tools/autoprefixer) |
