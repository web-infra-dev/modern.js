---
sidebar_position: 4
---

# Less 和 Sass

[Less](https://lesscss.org/) 和 [Sass](https://sass-lang.com/) 是常用的两种 CSS 预处理器，Modern.js 通过插件来提供 Less 和 Sass 编译能力的支持。

## 启用 Less 或 Sass

为了使用 Less 或 Sass 编译能力，我们需要先启用对应的功能。

以 Less 为例，在当前项目根目录执行 new 命令, 并选择 **启用 Less 支持** 即可。

```bash
$ pnpm run new
? 请选择你想要的操作
? 启用可选功能 (Use arrow keys)
❯ 启用 Less 支持
```

## 自定义配置

- 如果需要自定义 [less-loader](https://github.com/webpack-contrib/less-loader) 的配置，请参考 [tools.less](/docs/apis/app/config/tools/less) 配置项。
- 如果需要自定义 [sass-loader](https://github.com/webpack-contrib/sass-loader) 的配置，请参考 [tools.less](/docs/apis/app/config/tools/sass) 配置项。

:::tip 提示
经过 Less 和 Sass 预编译后的 CSS 文件，仍然会经过 Modern.js 内置的 [PostCSS](https://postcss.org/) 的转换，具备良好的浏览器兼容性。相关内容请参考【[PostCSS](/docs/guides/usages/css/postcss)】。
:::
