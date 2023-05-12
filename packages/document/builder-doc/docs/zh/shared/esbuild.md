[esbuild](https://esbuild.github.io/) 是一款基于 Golang 开发的前端构建工具，具有打包、编译和压缩 JavaScript 代码的功能，相比传统的打包编译工具，esbuild 在性能上有显著提升。在代码压缩方面，相比 webpack 内置的 terser 压缩器，esbuild 在性能上有数十倍的提升。

Modern.js Builder 提供了 esbuild 插件，让你能使用 esbuild 代替 babel-loader、ts-loader 和 terser 等库进行代码编译和压缩。在大型工程中启用 esbuild 后，**可以大幅度减少代码编译和压缩所需的时间，同时有效避免 OOM (heap out of memory) 问题**。
