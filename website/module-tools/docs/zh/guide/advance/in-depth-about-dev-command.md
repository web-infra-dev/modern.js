---
sidebar_position: 2
---

# 深入理解 dev 命令

在【基础使用】的部分，我们已经知道可以通过 `buildConfig` 配置对项目的输出产物进行修改。`buildConfig` 不仅描述了产物的一些特性，同时还为构建产物提供了一些功能。

:::tip{title=注意}
如果你还不清楚 `buildConfig` 是什么，建议花一些时间通过下面的链接了解一下：

- 【[修改输出产物](/guide/basic/modify-output-product)】
  :::

而在本章里我们将要深入理解某些构建配置的使用以及了解执行 `modern build` 命令的时候发生了什么。

## 深入理解 `buildConfig`

### Bundle 和 Bundleless

那么首先我们来理解一下 Bundle 和 Bundleless。

所谓 Bundle 是指对构建产物进行打包，构建产物可能是一个文件，也有可能是基于一定的[代码拆分策略](https://esbuild.github.io/api/#splitting)得到的多个文件。

而 Bundleless 则是指对每个源文件进行编译构建，但是并不将它们打包在一起。每一个产物文件都可以找到与之相对应的源码文件。

### input 与 sourceDir 的关系

## 构建过程
