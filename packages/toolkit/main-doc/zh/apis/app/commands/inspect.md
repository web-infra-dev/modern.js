---
sidebar_position: 7
---

```
Usage: modern inspect [options]

Options:
  --env <env>           查看指定环境下的配置 (default: "development")
  --output <output>     指定在 dist 目录下输出的路径 (default: "/")
  --verbose             在结果中展示函数的完整内容
  -c --config <config>  指定配置文件路径，可以为相对路径或绝对路径
  -h, --help            显示命令帮助
```

`modern inspect` 命令，用于查看项目的 [Modern.js Builder 配置](https://modernjs.dev/builder/zh/guide/basic/builder-config.html)以及 webpack 配置。

在项目根目录下执行命令 `npx modern inspect` 后，会在项目的 `dist` 目录生成以下文件：

- `builder.config.js`: 表示在构建时使用的 Modern.js Builder 配置。
- `webpack.config.web.js`: 表示在构建时使用的 webpack 配置。

## 指定环境

默认情况下，inspect 命令会输出开发环境的配置，你可以使用 `env` 选项来输出生产环境的配置：

```bash
modern inspect --env production
```

## 完整内容

默认情况下，inspect 命令会省略配置对象中的函数内容，你可以使用 `env` 选项来输出函数的完整内容：

```bash
modern inspect --verbose
```

## SSR 构建配置

如果项目开启了 SSR 能力，则在 `dist` 目录会另外生成一份 `webpack.config.node.js` 文件，对应 SSR 构建时的 webpack 配置。
