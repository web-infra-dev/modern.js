---
sidebar_position: 3
---

# 开发微生成器项目

## 创建项目

Modern.js 提供了创建微生成器项目的微生成器，可以直接通过以下命令创建微生成器项目：

```bash
$ mkdir <projectDir>
$ npx @modern-js/codesmith-cli @modern-js/generator-generator

? 请填写项目名称 <generatorName>
? 请选择包管理工具 pnpm
? 请选择开发语言 TS
```

## 添加模板文件

在项目目录的 templates 文件夹，用于存放生成器需要的模板文件，如果没有模板文件，该步骤可跳过。

## 开发生成器核心逻辑

默认生成的的项目中，已经实现直接拷贝 templates 目录文件至目标项目，可直接在 `handleTemplateFile` 函数中完成生成器的核心逻辑开发。

## 测试微生成器

微生成器开发完成后，需要执行 `pnpm run build` 对代码进行编译，在开发模式下可以使用 `pnpm run build --watch`

codesmith 提供了 cli 工具用于运行和测试微生成器，在目标目录执行使用如下命令执行即可：

```bash
npx @modern-js/codesmith-cli <generatorPath>
```

其中 generatorPath 为上述生成器项目的绝对路径。

## 运行微生成器

生成器发布 npm 包之后，使用如下命令执行：

```bash
npx @modern-js/codesmith-cli <generatorName>
```

其中 generatorName 为生成器包名。

:::info
`@modern-js/create` 也支持运行微生成器，可以使用 `npx @modern-js/create --generator <generatorName>` 运行自定义的微生成器。
:::
