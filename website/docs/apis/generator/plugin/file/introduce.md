---
sidebar_position: 1
---

# 介绍

文件操作 API 可在 onForged 生命周期函数中使用，可对当前项目文件进行增、删、改的操作。

文件操作 API 相关路径填写项目相对路径即可，生成器插件会自动添加当前项目路径前缀。

## 文件类型

生成器插件将文件类型分为一下几类：

- 文本文件：纯文本内容文件，可使用 handlebars 进行模板处理的文件。

- 二进制文件：图片、音频、视频等文件

:::warning
使用变量的 jsx 或 tsx 文件为二进制文件，其语法与 handlebars 渲染冲突，会造成模板文件创建失败。
:::

- JSON 文件：JSON 格式的文件，例如 `package.json`、 `tsconfig.json`。

- 文本列表文件：文件由行文本组成的文件，例如 `.gitignore`, `.editorconfig`, `.npmrc`。

生成器插件的文件操作 API 将是针对这四种文件类型进行操作。

其类型定义为：
```ts
export enum FileType {
  Text = 'text',
  Binary = 'binary',
  Json = 'json',
  TextRaw = 'textRaw',
}
```
