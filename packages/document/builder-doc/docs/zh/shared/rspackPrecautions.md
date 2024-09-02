## 注意事项

在使用 Rspack 前，你需要了解以下事项：

- Rspack 能够兼容大部分 webpack 插件和几乎所有的 loaders，但仍有少数 webpack 插件暂时无法使用，详见 [Plugin 兼容](https://rspack.dev/zh/guide/compatibility/plugin)。
- Rspack 默认基于 [SWC](https://rspack.dev/zh/guide/features/builtin-swc-loader) 进行代码编译和压缩，在个别情况下，你可能会遇到 SWC 在边界场景的 bug，可以通过 [SWC 的 issue](https://github.com/swc-project/swc/issues) 反馈。
