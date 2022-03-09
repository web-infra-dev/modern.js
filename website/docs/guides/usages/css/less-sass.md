---
sidebar_position: 4
---

# Less 和 Sass

:::info 补充信息
Modern.js 已内置 [PostCSS](https://postcss.org/) 及其常用插件，一般情况下使用普通 `.css` 后缀的样式文件已经可以满足大多数项目需求，无需使用 Less 或 Sass。
:::

[Less](https://lesscss.org/) 和 [Sass](https://sass-lang.com/) 是常用的两种 CSS 预处理器。使用 Less 或 Sass 支持，需要先启用该功能。以 Less 为例，在项目根目录下执行：

```bash
pnpm run new
```

按照如下选择操作，即可启用 Less 支持：
```bash
? 请选择你想要的操作: 启用可选功能
? 启用可选功能: 启用 Less 支持
```

:::info 补充信息
如需对 [`less-loader`](https://github.com/webpack-contrib/less-loader) 或 [`sass-loader`](https://github.com/webpack-contrib/sass-loader) 做配置，请参考配置 [`tools.less`](/docs/apis/config/tools/less) 和 [`tools.sass`](/docs/apis/config/tools/sass) 的使用。
:::

:::tip 提示
经过 Less 和 Sass 预编译后的 CSS 文件，仍然会经过 Modern.js 内置的 [PostCSS](https://postcss.org/) 的转换，具备良好的浏览器兼容性。相关内容请参考【[PostCSS](/docs/guides/usages/css/postcss)】。
:::
