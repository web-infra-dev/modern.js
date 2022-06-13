---
sidebar_position: 7
---

```
Usage: modern inspect [options]

inspect internal webpack config

Options:
  --env <env>          查看指定环境下的配置 (default: "development")
  --output <output>    指定在 dist 目录下输出的路径 (default: "/")
  --no-console         不在终端中输出完整结果
  --verbose            在结果中展示函数的完整内容
  -h, --help           显示命令帮助
```

`modern inspect` 命令，用于查看项目的 webpack 完整配置。

在项目根目录下执行命令 `npx modern inspect`，会将 webpack 配置输出在终端界面，同时也会在项目的 `dist` 目录生成一份 `webpack.client.inspect.js` 文件，开发者可手动打开查看。

## 指定环境

默认情况下，会输出开发环境的 webpack 配置，可以使用 `env` 选项来输出生产环境的配置：

```bash
modern inspect --env production
```

## 配置类型

### SSR 配置

如果项目开启了 SSR 能力，则在 `dist` 目录会另外生成一份 `webpack.ssr.inspect.js` 文件，对应 SSR 构建时的 webpack 配置。

### Modern 配置

如果项目开启了 [enableModernMode](/docs/apis/config/output/enable-modern-mode) 选项，则在 `dist` 目录会另外生成一份 `webpack.modern.inspect.js` 文件，对应现代浏览器的 webpack 配置。
