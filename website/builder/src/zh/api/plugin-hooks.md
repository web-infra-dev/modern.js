---
extractApiHeaders: [2]
---

# Plugin Hooks

本章节描述了 Builder 提供的生命周期钩子。

## 概览

- **通用钩子**
  - `modifyBuilderConfig`：修改传递给 Builder 的配置项
  - `modifyWebpackChain`：修改 webpack chain 配置
  - `modifyWebpackConfig`：修改最终的 webpack 配置
  - `onBeforeCreateCompiler`：创建编译器前触发
  - `onAfterCreateCompiler`：创建编译器后触发、在构建前操作编译器实例
- **构建钩子**：仅运行构建输出产物时触发
  - `onBeforeBuild`：构建前触发
  - `onAfterBuild`：构建后触发、获取构建结果信息
- **开发服务钩子**：仅运行开发服务器时触发
  - `onBeforeStartDevServer`：启动开发服务器前触发
  - `onAfterStartDevServer`：启动开发服务器后触发
  - `onDevCompileDone`：每次增量构建结束后触发
- **进程钩子**
  - `onExit`：运行构建的进程即将退出时触发

## 通用钩子

### modifyBuilderConfig

TODO

### modifyWebpackChain

TODO

### modifyWebpackConfig

TODO

### onBeforeCreateCompiler

TODO

### onAfterCreateCompiler

TODO

## 构建钩子

### onBeforeBuild

TODO

### onAfterBuild

TODO

## 开发服务钩子

### onBeforeStartDevServer

TODO

### onAfterStartDevServer

TODO

### onDevCompileDone

TODO

## 进程钩子

### onExit

TODO
