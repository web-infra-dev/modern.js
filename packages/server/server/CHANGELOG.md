# @modern-js/server

## 2.1.0

### Patch Changes

- 3d0fb38: fix: remove the prebundle for data loader
  fix: 移除 data loader 的预打包
- Updated dependencies [837620c]
- Updated dependencies [8a9482c]
  - @modern-js/utils@2.1.0
  - @modern-js/prod-server@2.1.0
  - @modern-js/server-utils@2.1.0
  - @modern-js/types@2.1.0

## 2.0.2

### Patch Changes

- Updated dependencies [39988b2]
  - @modern-js/types@2.0.2
  - @modern-js/prod-server@2.0.2
  - @modern-js/utils@2.0.2
  - @modern-js/server-utils@2.0.2

## 2.0.1

### Patch Changes

- @modern-js/prod-server@2.0.1
- @modern-js/server-utils@2.0.1
- @modern-js/types@2.0.1
- @modern-js/utils@2.0.1

## 2.0.0

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- Updated dependencies [c9e800d39a]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [6bda14ed71]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [ffb2ed4]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/prod-server@2.0.0
  - @modern-js/utils@2.0.0
  - @modern-js/types@2.0.0
  - @modern-js/server-utils@2.0.0

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- Updated dependencies [c9e800d39a]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [6bda14ed71]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/prod-server@2.0.0-beta.7
  - @modern-js/utils@2.0.0-beta.7
  - @modern-js/types@2.0.0-beta.7
  - @modern-js/server-utils@2.0.0-beta.7

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- b710adb843: feat: extract the data loader
  feat: 提取 data loader

### Patch Changes

- 7879e8f711: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- d4e8e6fb90: fix: modernjs dev server can't start normaly
  fix: modernjs dev 服务端不能正常启动
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- 61f21d1e77: fix: ignore the entire distPath for pia ssr bundle
  fix: dist 目录的产物不应该被 ts-node 编译
- 4f277fe288: fix(server): remove peer dependencies warning

  fix(server): 修复 peer dependencies 出现 warning 提示的问题

- cce8ecee2d: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- ea7cf06257: chore: bump webpack/babel-loader/postcss-loader/tsconfig-paths

  chore: 升级 webpack/babel-loader/postcss-loader/tsconfig-paths 版本

- ebbeed1ece: chore: dev server default cross origin
  chore: 开发环境 Server 默认跨域
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [9b915e0c10]
- Updated dependencies [7879e8f711]
- Updated dependencies [c9e800d39a]
- Updated dependencies [d4e8e6fb90]
- Updated dependencies [d032d49e09]
- Updated dependencies [6aca875011]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12cf8f]
- Updated dependencies [7efeed4]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [a8642da58f]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [87c1ff86b9]
- Updated dependencies [c2bb0f1745]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [73cd29dd9f]
- Updated dependencies [b710adb843]
- Updated dependencies [cce8ecee2d]
- Updated dependencies [18aaf42249]
- Updated dependencies [ea7cf06257]
- Updated dependencies [bbe4c4ab64]
- Updated dependencies [e4558a0bc4]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/server-utils@2.0.0-beta.6
  - @modern-js/prod-server@2.0.0-beta.6
  - @modern-js/types@2.0.0-beta.6
  - @modern-js/utils@2.0.0-beta.6

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- b710adb843: feat: extract the data loader
  feat: 提取 data loader

### Patch Changes

- 7879e8f: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- d4e8e6fb90: fix: modernjs dev server can't start normaly
  fix: modernjs dev 服务端不能正常启动
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- 61f21d1e77: fix: ignore the entire distPath for pia ssr bundle
  fix: dist 目录的产物不应该被 ts-node 编译
- 4f277fe: fix(server): remove peer dependencies warning

  fix(server): 修复 peer dependencies 出现 warning 提示的问题

- cce8ecee2d: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- ea7cf06: chore: bump webpack/babel-loader/postcss-loader/tsconfig-paths

  chore: 升级 webpack/babel-loader/postcss-loader/tsconfig-paths 版本

- ebbeed1ece: chore: dev server default cross origin
  chore: 开发环境 Server 默认跨域
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [9b915e0c10]
- Updated dependencies [7879e8f]
- Updated dependencies [c9e800d39a]
- Updated dependencies [d4e8e6fb90]
- Updated dependencies [d032d49e09]
- Updated dependencies [6aca875]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12c]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [a8642da58f]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [87c1ff86b9]
- Updated dependencies [c2bb0f1745]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [73cd29dd9f]
- Updated dependencies [b710adb843]
- Updated dependencies [cce8ecee2d]
- Updated dependencies [18aaf42249]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/server-utils@2.0.0-beta.4
  - @modern-js/prod-server@2.0.0-beta.4
  - @modern-js/types@2.0.0-beta.4
  - @modern-js/utils@2.0.0-beta.4

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- b710adb: feat: extract the data loader
  feat: 提取 data loader

### Patch Changes

- d4e8e6f: fix: modernjs dev server can't start normaly
  fix: modernjs dev 服务端不能正常启动
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- 61f21d1e77: fix: ignore the entire distPath for pia ssr bundle
  fix: dist 目录的产物不应该被 ts-node 编译
- cce8ece: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- ea7cf06: chore: bump webpack/babel-loader/postcss-loader/tsconfig-paths

  chore: 升级 webpack/babel-loader/postcss-loader/tsconfig-paths 版本

- ebbeed1ece: chore: dev server default cross origin
  chore: 开发环境 Server 默认跨域
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [9b915e0c10]
- Updated dependencies [c9e800d39a]
- Updated dependencies [d4e8e6f]
- Updated dependencies [d032d49e09]
- Updated dependencies [6aca875]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [2e60319]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [a8642da58f]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [87c1ff86b9]
- Updated dependencies [c2bb0f1]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [73cd29dd9f]
- Updated dependencies [b710adb]
- Updated dependencies [cce8ece]
- Updated dependencies [18aaf42249]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/server-utils@2.0.0-beta.3
  - @modern-js/prod-server@2.0.0-beta.3
  - @modern-js/utils@2.0.0-beta.3
  - @modern-js/types@2.0.0-beta.3

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- 61f21d1e77: fix: ignore the entire distPath for pia ssr bundle
  fix: dist 目录的产物不应该被 ts-node 编译
- ebbeed1: chore: dev server default cross origin
  chore: 开发环境 Server 默认跨域
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [9b915e0c10]
- Updated dependencies [c9e800d39a]
- Updated dependencies [d032d49]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [a8642da58f]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed587]
- Updated dependencies [87c1ff8]
- Updated dependencies [c2bb0f1]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [73cd29dd9f]
- Updated dependencies [18aaf42]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/server-utils@2.0.0-beta.2
  - @modern-js/prod-server@2.0.0-beta.2
  - @modern-js/utils@2.0.0-beta.2
  - @modern-js/types@2.0.0-beta.2

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- 61f21d1e77: fix: ignore the entire distPath for pia ssr bundle
  fix: dist 目录的产物不应该被 ts-node 编译
- ebbeed1: chore: dev server default cross origin
  chore: 开发环境 Server 默认跨域
- 14b712d: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [9b915e0c10]
- Updated dependencies [c9e800d39a]
- Updated dependencies [d032d49]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f]
- Updated dependencies [6bda14ed71]
- Updated dependencies [a8642da]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed587]
- Updated dependencies [87c1ff8]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [73cd29dd9f]
- Updated dependencies [18aaf42]
- Updated dependencies [abf3421]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712d]
  - @modern-js/server-utils@2.0.0-beta.1
  - @modern-js/prod-server@2.0.0-beta.1
  - @modern-js/utils@2.0.0-beta.1
  - @modern-js/types@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Patch Changes

- 15bf09d9c: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- 61f21d1e7: fix: ignore the entire distPath for pia ssr bundle
  fix: dist 目录的产物不应该被 ts-node 编译
- 14b712d: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [9b915e0c1]
- Updated dependencies [c9e800d39]
- Updated dependencies [15bf09d9c]
- Updated dependencies [edd1cfb1a]
- Updated dependencies [cc971eabf]
- Updated dependencies [5b9049f]
- Updated dependencies [6bda14ed7]
- Updated dependencies [a8642da]
- Updated dependencies [b8bbe036c]
- Updated dependencies [d5a31df78]
- Updated dependencies [dda38c9]
- Updated dependencies [102d32e4b]
- Updated dependencies [8b8e1bb57]
- Updated dependencies [3bbea92b2]
- Updated dependencies [73cd29dd9]
- Updated dependencies [abf3421]
- Updated dependencies [543be95]
- Updated dependencies [14b712d]
  - @modern-js/server-utils@2.0.0-beta.0
  - @modern-js/prod-server@2.0.0-beta.0
  - @modern-js/utils@2.0.0-beta.0
  - @modern-js/types@2.0.0-beta.0

## 1.21.2

### Patch Changes

- @modern-js/prod-server@1.21.2
- @modern-js/server-utils@1.21.2
- @modern-js/types@1.21.2
- @modern-js/utils@1.21.2

## 1.21.1

### Patch Changes

- @modern-js/prod-server@1.21.1
- @modern-js/server-utils@1.21.1
- @modern-js/types@1.21.1
- @modern-js/utils@1.21.1

## 1.21.0

### Patch Changes

- f51c59a: feat: remove node internal package like fs or path which import by ssr runtime
  feat: 删除在 ssr runtime 中引用的 node 内部包
- Updated dependencies [f51c59a]
- Updated dependencies [8f3674a]
- Updated dependencies [8f3674a]
- Updated dependencies [519965e]
- Updated dependencies [67d80b7]
  - @modern-js/prod-server@1.21.0
  - @modern-js/types@1.21.0
  - @modern-js/server-utils@1.21.0
  - @modern-js/utils@1.21.0

## 1.20.1

### Patch Changes

- Updated dependencies [49515c5]
  - @modern-js/utils@1.20.1
  - @modern-js/prod-server@1.20.1
  - @modern-js/server-utils@1.20.1
  - @modern-js/types@1.20.1

## 1.20.0

### Patch Changes

- 35c0959: feat(devServer): support devServer.setupMiddlewares config

  feat(devServer): 支持 devServer.setupMiddlewares 配置项

- 4ddc185: chore(builder): bump webpack to 5.74.0

  chore(builder): 升级 webpack 到 5.74.0 版本

- 66e4817: feat: support devServer.historyApiFallback

  feat: 支持 devServer.historyApiFallback 配置项

- face165: chore(devServer): get devServer config from this.dev

  chore(devServer): 从 this.dev 上获取 devServer 配置

- Updated dependencies [d5d570b]
- Updated dependencies [4ddc185]
- Updated dependencies [66e4817]
- Updated dependencies [df8ee7e]
- Updated dependencies [8c05089]
- Updated dependencies [baf7337]
  - @modern-js/utils@1.20.0
  - @modern-js/types@1.20.0
  - @modern-js/prod-server@1.20.0
  - @modern-js/server-utils@1.20.0

## 1.19.0

### Patch Changes

- Updated dependencies [1903f68]
  - @modern-js/prod-server@1.19.0
  - @modern-js/server-utils@1.19.0
  - @modern-js/types@1.19.0
  - @modern-js/utils@1.19.0

## 1.18.1

### Patch Changes

- 318e149: fix: tools.devServer type missing some properties

  fix: 修复 tools.devServer 类型定义不完整的问题

- 60d95ad: fix: dev server config should be optional
  fix: devServer 配置项应该是可选配置的
- 8016a8a: fix: invoke next() in dev-middleware directly if only api
  fix: 在 api 服务的情况下，直接调用 next()，不执行 dev-middleware
- f6a3aa1: feat: support etag in dev server by default
  feat: 开发环境默认支持 etag 功能
- 23fa468: fix: ssr bundle should not be compiled by ts-node

  fix: ts-node 不应该编译 ssr bundle

- 55988fa: fix: fix dev server type error
  fix: 修复 dev server 中的类型错误
- bc3bbd8: fix: use output.publicPath(default) as webpack-dev-middleware publicPath

  fix: 使用 output.publicPath 作为 webpack-dev-middleware publicPath

- Updated dependencies [3586707]
- Updated dependencies [318e149]
- Updated dependencies [60d95ad]
- Updated dependencies [f6a3aa1]
- Updated dependencies [fb02c81]
- Updated dependencies [9f7bfa6]
- Updated dependencies [9fcfbd4]
- Updated dependencies [6c2c745]
  - @modern-js/prod-server@1.18.1
  - @modern-js/types@1.18.1
  - @modern-js/server-utils@1.18.1
  - @modern-js/utils@1.18.1

## 1.18.0

### Patch Changes

- 3d5e3a5: chore: get api mode from bff core
  chore: 从 bff core 中获取 api mode
- 8280920: chore(server): export DevServerOptions type

  chore(server): 导出 DevServerOptions 类型

- 2b7406d: feat: use typescript instead of babel as typescript compiler in server
  feat: 服务端，增加 typescript 作为 typescipt 编译器
- fc7214d: feat(server): export DevServerHttpsOptions type

  feat(server): 导出 DevServerHttpsOptions 类型

- Updated dependencies [8280920]
- Updated dependencies [3d5e3a5]
- Updated dependencies [2b7406d]
- Updated dependencies [0a4d622]
- Updated dependencies [60a2e3a]
- Updated dependencies [5227370]
- Updated dependencies [7928bae]
  - @modern-js/utils@1.18.0
  - @modern-js/prod-server@1.18.0
  - @modern-js/server-utils@1.18.0

## 1.17.0

### Patch Changes

- 151329d: chore(dev-server): no longer depend on @modern-js/webpack

  chore(dev-server): 不再依赖 @modern-js/webpack

- Updated dependencies [1b9176f]
- Updated dependencies [77d3a38]
- Updated dependencies [151329d]
- Updated dependencies [5af9472]
- Updated dependencies [6b6a534]
- Updated dependencies [6b43a2b]
- Updated dependencies [a7be124]
- Updated dependencies [31547b4]
  - @modern-js/utils@1.17.0
  - @modern-js/prod-server@1.17.0
  - @modern-js/server-utils@1.17.0

## 1.16.0

### Patch Changes

- 2808ff5a2: fix(dev-server): support enable hmr client by webpack target

  fix(dev-server): 支持通过 webpack target 来判断是否启用 hmr client

- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
  - @modern-js/utils@1.16.0
  - @modern-js/webpack@1.16.0
  - @modern-js/server-utils@1.16.0
  - @modern-js/prod-server@1.16.0

## 1.15.0

### Patch Changes

- b1f7000: fix: Adjust createServer logic in bff test plugin
  fix: 调整 BFF 测试中 create server 的逻辑
- Updated dependencies [8658a78]
- Updated dependencies [0df4970]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [c087148]
- Updated dependencies [37cd159]
  - @modern-js/utils@1.15.0
  - @modern-js/webpack@1.15.0
  - @modern-js/prod-server@1.15.0
  - @modern-js/server-utils@1.15.0

## 1.6.0

### Minor Changes

- 83660b6: chore(server): merge `@modern-js/hmr-client` to `@modern-js/server`

  chore(server): 合并 `@modern-js/hmr-client` 到 `@modern-js/server`

### Patch Changes

- Updated dependencies [1421965]
- Updated dependencies [02647d2]
- Updated dependencies [4fc801f]
- Updated dependencies [9d60891]
- Updated dependencies [2ed8f7d]
- Updated dependencies [e4b73b2]
- Updated dependencies [c8614b8]
- Updated dependencies [df73691]
  - @modern-js/webpack@1.12.2
  - @modern-js/utils@1.8.0
  - @modern-js/prod-server@1.2.1
  - @modern-js/server-utils@1.2.11

## 1.5.1

### Patch Changes

- a27ab8d: feat: add onApiChange hook for bff hot reload
  feat: 为 BFF 热更新优化，添加 onApiChange 钩子
- Updated dependencies [b74b0b6]
- Updated dependencies [7b902b3]
- Updated dependencies [3d64b2f]
- Updated dependencies [8b2aa56]
- Updated dependencies [3e4a34f]
- Updated dependencies [33cebd2]
  - @modern-js/webpack@1.12.0
  - @modern-js/prod-server@1.2.0
  - @modern-js/server-utils@1.2.11
  - @modern-js/utils@1.7.12

## 1.5.0

### Minor Changes

- 77a8e9e: feat: support bff operators

### Patch Changes

- d9564f2: feat: add watchOptions for server watcher
- Updated dependencies [550e2bd]
- Updated dependencies [87eb9f8]
- Updated dependencies [2b06fe3]
- Updated dependencies [3050acc]
- Updated dependencies [f29e9ba]
- Updated dependencies [2dacc89]
- Updated dependencies [338496c]
- Updated dependencies [a90bc96]
  - @modern-js/webpack@1.11.3
  - @modern-js/prod-server@1.1.9
  - @modern-js/utils@1.7.9
  - @modern-js/server-utils@1.2.11

## 1.4.21

### Patch Changes

- 3172e1ee1: update devcert version
- Updated dependencies [06b411dc3]
- Updated dependencies [5d4806f86]
- Updated dependencies [63c354ad5]
- Updated dependencies [4165e50c7]
- Updated dependencies [073e9ad78]
- Updated dependencies [cda99c441]
- Updated dependencies [b96dcf364]
- Updated dependencies [f4a7d49e1]
- Updated dependencies [9e36d3a01]
  - @modern-js/webpack@1.11.1
  - @modern-js/utils@1.7.8
  - @modern-js/prod-server@1.1.8
  - @modern-js/server-utils@1.2.11

## 1.4.20

### Patch Changes

- 209d0a927: release: hot fix garfish error
- 002dab527: fix: support configure headers by devServer headers
- Updated dependencies [ded45811c]
- Updated dependencies [9d649884b]
- Updated dependencies [9377d2d9d]
- Updated dependencies [8e1cedd8a]
- Updated dependencies [8c9ad1749]
- Updated dependencies [6b2523f44]
- Updated dependencies [b7a1cea52]
  - @modern-js/webpack@1.11.0
  - @modern-js/utils@1.7.7
  - @modern-js/server-utils@1.2.11
  - @modern-js/prod-server@1.1.8

## 1.4.18

### Patch Changes

- 8d508c6ed: feat(devServer): support disable hmr or live reload
- a1198d509: feat: bump babel 7.18.0
- Updated dependencies [8d508c6ed]
- Updated dependencies [a1198d509]
- Updated dependencies [29728812e]
- Updated dependencies [147e090f7]
- Updated dependencies [18892c65c]
- Updated dependencies [a1198d509]
  - @modern-js/webpack@1.10.0
  - @modern-js/bff-utils@1.2.9
  - @modern-js/hmr-client@1.2.8
  - @modern-js/prod-server@1.1.8
  - @modern-js/server-utils@1.2.10

## 1.4.17

### Patch Changes

- d4afeba71: fix: remove cors for prod-server
- f8e713253: fix(server): using correct webpack instance
- Updated dependencies [6c8ab42dd]
- Updated dependencies [ed90859ba]
- Updated dependencies [0ef2431cb]
- Updated dependencies [d4afeba71]
  - @modern-js/webpack@1.9.1
  - @modern-js/prod-server@1.1.7

## 1.4.16

### Patch Changes

- f7cbc771: feat: prebundle webpack-dev-middleware
- cdc2df9c: fix(server): remove launch-editor
- b39b399e: lock devcert version
- 430d417e: optimize server side hot reload
- 437367c6: fix(server): hmr not working when using proxy
- Updated dependencies [5f7fccf0]
- Updated dependencies [02b0a22e]
- Updated dependencies [da65bf12]
- Updated dependencies [8854c600]
- Updated dependencies [d57e7622]
- Updated dependencies [f7cbc771]
- Updated dependencies [6451a098]
- Updated dependencies [f5c48c3f]
- Updated dependencies [430d417e]
- Updated dependencies [658b4dd5]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [45d5643a]
- Updated dependencies [0d161fa8]
- Updated dependencies [437367c6]
- Updated dependencies [280eebf9]
- Updated dependencies [2ba8d62f]
- Updated dependencies [7394df61]
  - @modern-js/webpack@1.9.0
  - @modern-js/bff-utils@1.2.8
  - @modern-js/utils@1.7.6
  - @modern-js/prod-server@1.1.6
  - @modern-js/server-utils@1.2.9

## 1.4.15

### Patch Changes

- b8cfc42cd: feat: prebundle tsconfig-paths and nanoid
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
  - @modern-js/utils@1.7.4
  - @modern-js/prod-server@1.1.5
  - @modern-js/server-utils@1.2.6

## 1.4.14

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d32f35134]
- Updated dependencies [86fe5a657]
- Updated dependencies [aeda91deb]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [1a30be07b]
- Updated dependencies [948cc4436]
  - @modern-js/bff-utils@1.2.6
  - @modern-js/hmr-client@1.2.7
  - @modern-js/prod-server@1.1.5
  - @modern-js/server-utils@1.2.6
  - @modern-js/utils@1.7.3

## 1.4.13

### Patch Changes

- 0e0537005: fix: unlock @babel/core version
- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [0e0537005]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/server-utils@1.2.5
  - @modern-js/bff-utils@1.2.5
  - @modern-js/hmr-client@1.2.6
  - @modern-js/prod-server@1.1.4

## 1.4.12

### Patch Changes

- 6fa74d5f: add internal metrics and logger
- Updated dependencies [0ee4bb4e]
- Updated dependencies [a4c5fe78]
- Updated dependencies [6fa74d5f]
  - @modern-js/utils@1.7.0
  - @modern-js/prod-server@1.1.3
  - @modern-js/server-utils@1.2.4

## 1.4.11

### Patch Changes

- a0475f1a: fix: missing @babel/core peer dependencies
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- 247e2005: support devServer.devMiddleware, same as webpack-dev-server
- Updated dependencies [2d155c4c]
- Updated dependencies [a0499e4f]
- Updated dependencies [123e432d]
- Updated dependencies [e5a9b26d]
- Updated dependencies [0b26b93b]
- Updated dependencies [123e432d]
- Updated dependencies [f9f66ef9]
- Updated dependencies [592edabc]
- Updated dependencies [895fa0ff]
- Updated dependencies [3578913e]
- Updated dependencies [1c3beab3]
  - @modern-js/utils@1.6.0
  - @modern-js/prod-server@1.1.2
  - @modern-js/bff-utils@1.2.4
  - @modern-js/server-utils@1.2.4

## 1.4.10

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- 28ac120a: fix: remove unused webpack/hot/dev-server entry
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/bff-utils@1.2.3
  - @modern-js/hmr-client@1.2.5
  - @modern-js/prod-server@1.1.1
  - @modern-js/server-utils@1.2.3

## 1.4.9

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- Updated dependencies [bebb39b6]
- Updated dependencies [afc836f4]
- Updated dependencies [132f7b53]
  - @modern-js/prod-server@1.0.6
  - @modern-js/server-utils@1.2.2
  - @modern-js/hmr-client@1.2.3
  - @modern-js/utils@1.3.7

## 1.4.8

### Patch Changes

- a8df060e: support setup dev middleware first step
- d2d0fa11: fix: missing devServer.proxy typing
- 6a7acb81: modify devServer type and name
- Updated dependencies [c2046f37]
- Updated dependencies [d2d0fa11]
  - @modern-js/utils@1.3.6
  - @modern-js/prod-server@1.0.5

## 1.4.7

### Patch Changes

- d95f28c3: remove server hook when api only
- d5bf095a: fix: disable load webpack when apiOnly mode
- 9229dfd1: support custom headers, fix hmr url concat
- Updated dependencies [5bf5868d]
- Updated dependencies [d95f28c3]
- Updated dependencies [d95f28c3]
- Updated dependencies [0923c182]
- Updated dependencies [2008fdbd]
- Updated dependencies [ca0bcf13]
  - @modern-js/utils@1.3.5
  - @modern-js/prod-server@1.0.4

## 1.4.6

### Patch Changes

- a78e32d8: remove server hook when api only
- 59010b7a: rewrite server lifecycle, add unit test
- Updated dependencies [a78e32d8]
- Updated dependencies [e11eaafc]
- Updated dependencies [cbba492b]
- Updated dependencies [db43dce6]
- Updated dependencies [59010b7a]
  - @modern-js/prod-server@1.0.2
  - @modern-js/utils@1.3.4

## 1.4.4

### Patch Changes

- 55e18278: chore: remove unused dependencies and devDependencies
- 02fb4146: support product server
- Updated dependencies [4c792f68]
- Updated dependencies [02fb4146]
- Updated dependencies [a7f42f48]
  - @modern-js/utils@1.3.3
  - @modern-js/prod-server@1.0.1

## 1.4.3

### Patch Changes

- deeaa602: support svg/proxy/multi-version in unbundled
- fab92861: fix: @modern-js/core phantom dep
- Updated dependencies [deeaa602]
- Updated dependencies [54786e58]
  - @modern-js/hmr-client@1.2.2
  - @modern-js/utils@1.3.2
  - @modern-js/core@1.4.3

## 1.4.2

### Patch Changes

- 735b2a81: prevent ssr compiler to send socket message
- Updated dependencies [b376c8d6]
- Updated dependencies [e62c4efd]
- Updated dependencies [e2a8233f]
  - @modern-js/core@1.4.2

## 1.4.1

### Patch Changes

- 2cfc4235: support cssPath/jsPath/mediaPath in production mode
- 8d55e234: fix: catch api error
- Updated dependencies [53aca274]
- Updated dependencies [78279953]
- Updated dependencies [e116ace5]
- Updated dependencies [4d72edea]
  - @modern-js/core@1.4.1
  - @modern-js/utils@1.3.1

## 1.4.0

### Minor Changes

- ec4dbffb: feat: support as a pure api service

### Patch Changes

- 816fd721: support more server context
- d9cc5ea9: support resatrt options transfer
- bfbea9a7: support multi base url and dynamic base url
- d099e5c5: fix error when modify modern.config.js
- 24f616ca: feat: support custom meta info
- 272cab15: refactor server plugin manager
- Updated dependencies [d9cc5ea9]
- Updated dependencies [bd819a8d]
- Updated dependencies [ec4dbffb]
- Updated dependencies [d099e5c5]
- Updated dependencies [bada2879]
- Updated dependencies [24f616ca]
- Updated dependencies [bd819a8d]
- Updated dependencies [272cab15]
  - @modern-js/core@1.4.0
  - @modern-js/utils@1.3.0
  - @modern-js/server-core@1.2.2

## 1.3.2

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
- Updated dependencies [c3de9882]
- Updated dependencies [33ff48af]
  - @modern-js/core@1.3.2
  - @modern-js/bff-utils@1.2.2
  - @modern-js/hmr-client@1.2.1
  - @modern-js/server-plugin@1.2.1
  - @modern-js/server-utils@1.2.1
  - @modern-js/utils@1.2.2

## 1.3.1

### Patch Changes

- e2d3a575: fix extending core config interface
- 823809c6: fix: hot reload not working on windows
- e2d3a575: fix extending core config interface
- Updated dependencies [823809c6]
- Updated dependencies [4584cc04]
- Updated dependencies [7c19fd94]
  - @modern-js/bff-utils@1.2.1
  - @modern-js/utils@1.2.1
  - @modern-js/core@1.3.1

## 1.3.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 146dcd85: modify server framework plugin hook types and hook context
- c3d46ee4: fix: test config invalid
- 146dcd85: modify server framework plugin hook types
- 146dcd85: fix test case in babel compiler
- 1ebc7ee2: fix: @babel/core version
- Updated dependencies [2da09c69]
- Updated dependencies [fc71e36f]
- Updated dependencies [146dcd85]
- Updated dependencies [74ce3bb7]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
- Updated dependencies [146dcd85]
- Updated dependencies [8e7603ee]
- Updated dependencies [146dcd85]
- Updated dependencies [1ebc7ee2]
  - @modern-js/utils@1.2.0
  - @modern-js/core@1.3.0
  - @modern-js/server-utils@1.2.0
  - @modern-js/hmr-client@1.2.0
  - @modern-js/bff-utils@1.2.0
  - @modern-js/server-plugin@1.2.0

## 1.2.1

### Patch Changes

- e51b1db3: feat: support custom sdk, interceptor, headers for bff request
- Updated dependencies [e51b1db3]
- Updated dependencies [b7fb82ec]
  - @modern-js/server-plugin@1.1.4
  - @modern-js/utils@1.1.6

## 1.2.0

### Minor Changes

- 5a4c557e: feat: support bff test

### Patch Changes

- e04914ce: add route types, fix metrics types
- e04914ce: add route types, fix metrics types
- Updated dependencies [90eeb72c]
- Updated dependencies [e04914ce]
- Updated dependencies [5a4c557e]
- Updated dependencies [e04914ce]
- Updated dependencies [ca7dcb32]
- Updated dependencies [ecb344dc]
  - @modern-js/core@1.2.0
  - @modern-js/server-plugin@1.1.3
  - @modern-js/utils@1.1.5

## 1.1.4

### Patch Changes

- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- Updated dependencies [d927bc83]
- Updated dependencies [d73ff455]
- Updated dependencies [9c1ab865]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
  - @modern-js/utils@1.1.4
  - @modern-js/core@1.1.4

## 1.1.3

### Patch Changes

- 085a6a58: refactor server plugin
- 085a6a58: refactor server plugin
- 085a6a58: refactor server conifg
- 085a6a58: support server runtime
- 085a6a58: feat: refactor server plugin
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
- Updated dependencies [d280ea33]
- Updated dependencies [d4fcc73a]
- Updated dependencies [085a6a58]
- Updated dependencies [ed1f6b12]
- Updated dependencies [a5ebbb00]
- Updated dependencies [085a6a58]
  - @modern-js/core@1.1.3
  - @modern-js/server-plugin@1.1.2
  - @modern-js/server-utils@1.1.2
  - @modern-js/utils@1.1.3

## 1.1.2

### Patch Changes

- 0fa83663: support more .env files
- f594fbc8: fix apple icon and favicon support
- d1fde77a: fix public/ file in windows
- Updated dependencies [6f7fe574]
- Updated dependencies [b011e0c5]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/core@1.1.2
  - @modern-js/server-utils@1.1.1
  - @modern-js/bff-utils@1.1.1
  - @modern-js/hmr-client@1.1.1
  - @modern-js/server-plugin@1.1.1
  - @modern-js/utils@1.1.2

## 1.1.1

### Patch Changes

- c0fc0700: feat: support deploy plugin
- Updated dependencies [687c92c7]
- Updated dependencies [c0fc0700]
  - @modern-js/core@1.1.1
  - @modern-js/utils@1.1.1

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/core@1.1.0
  - @modern-js/bff-utils@1.1.0
  - @modern-js/hmr-client@1.1.0
  - @modern-js/server-plugin@1.1.0
  - @modern-js/plugin-polyfill@1.1.0
  - @modern-js/server-utils@1.1.0
  - @modern-js/utils@1.1.0

## 1.0.0

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0
  - @modern-js/bff-utils@1.0.0
  - @modern-js/hmr-client@1.0.0
  - @modern-js/server-plugin@1.0.0
  - @modern-js/plugin-polyfill@1.0.0
  - @modern-js/server-utils@1.0.0
  - @modern-js/utils@1.0.0

## 1.0.0-rc.23

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.23
  - @modern-js/bff-utils@1.0.0-rc.23
  - @modern-js/hmr-client@1.0.0-rc.23
  - @modern-js/server-plugin@1.0.0-rc.23
  - @modern-js/plugin-polyfill@1.0.0-rc.23
  - @modern-js/server-utils@1.0.0-rc.23
  - @modern-js/utils@1.0.0-rc.23

## 1.0.0-rc.22

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.22
  - @modern-js/bff-utils@1.0.0-rc.22
  - @modern-js/hmr-client@1.0.0-rc.22
  - @modern-js/server-plugin@1.0.0-rc.22
  - @modern-js/plugin-polyfill@1.0.0-rc.22
  - @modern-js/server-utils@1.0.0-rc.22
  - @modern-js/utils@1.0.0-rc.22

## 1.0.0-rc.21

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.21
  - @modern-js/bff-utils@1.0.0-rc.21
  - @modern-js/hmr-client@1.0.0-rc.21
  - @modern-js/server-plugin@1.0.0-rc.21
  - @modern-js/plugin-polyfill@1.0.0-rc.21
  - @modern-js/server-utils@1.0.0-rc.21
  - @modern-js/utils@1.0.0-rc.21

## 1.0.0-rc.20

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [undefined]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.20
  - @modern-js/hmr-client@1.0.0-rc.20
  - @modern-js/server-plugin@1.0.0-rc.20
  - @modern-js/plugin-polyfill@1.0.0-rc.20
  - @modern-js/server-utils@1.0.0-rc.20
  - @modern-js/utils@1.0.0-rc.20

## 1.0.0-rc.19

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.19
  - @modern-js/hmr-client@1.0.0-rc.19
  - @modern-js/server-plugin@1.0.0-rc.19
  - @modern-js/plugin-polyfill@1.0.0-rc.19
  - @modern-js/server-utils@1.0.0-rc.19
  - @modern-js/utils@1.0.0-rc.19

## 1.0.0-rc.18

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.18
  - @modern-js/hmr-client@1.0.0-rc.18
  - @modern-js/server-plugin@1.0.0-rc.18
  - @modern-js/plugin-polyfill@1.0.0-rc.18
  - @modern-js/server-utils@1.0.0-rc.18
  - @modern-js/utils@1.0.0-rc.18

## 1.0.0-rc.17

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [undefined]
  - @modern-js/core@1.0.0-rc.17
  - @modern-js/hmr-client@1.0.0-rc.17
  - @modern-js/server-plugin@1.0.0-rc.17
  - @modern-js/plugin-polyfill@1.0.0-rc.17
  - @modern-js/server-utils@1.0.0-rc.17
  - @modern-js/utils@1.0.0-rc.17

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.16
  - @modern-js/hmr-client@1.0.0-rc.16
  - @modern-js/server-plugin@1.0.0-rc.16
  - @modern-js/plugin-polyfill@1.0.0-rc.16
  - @modern-js/server-utils@1.0.0-rc.16
  - @modern-js/utils@1.0.0-rc.16

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.15
  - @modern-js/hmr-client@1.0.0-rc.15
  - @modern-js/server-plugin@1.0.0-rc.15
  - @modern-js/plugin-polyfill@1.0.0-rc.15
  - @modern-js/server-utils@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.14
  - @modern-js/hmr-client@1.0.0-rc.14
  - @modern-js/server-plugin@1.0.0-rc.14
  - @modern-js/plugin-polyfill@1.0.0-rc.14
  - @modern-js/server-utils@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.13
  - @modern-js/hmr-client@1.0.0-rc.13
  - @modern-js/server-plugin@1.0.0-rc.13
  - @modern-js/plugin-polyfill@1.0.0-rc.13
  - @modern-js/server-utils@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.12
  - @modern-js/hmr-client@1.0.0-rc.12
  - @modern-js/server-plugin@1.0.0-rc.12
  - @modern-js/plugin-polyfill@1.0.0-rc.12
  - @modern-js/server-utils@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.11
  - @modern-js/hmr-client@1.0.0-rc.11
  - @modern-js/server-plugin@1.0.0-rc.11
  - @modern-js/plugin-polyfill@1.0.0-rc.11
  - @modern-js/server-utils@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.10
  - @modern-js/hmr-client@1.0.0-rc.10
  - @modern-js/server-plugin@1.0.0-rc.10
  - @modern-js/plugin-polyfill@1.0.0-rc.10
  - @modern-js/server-utils@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.9
  - @modern-js/hmr-client@1.0.0-rc.9
  - @modern-js/server-plugin@1.0.0-rc.9
  - @modern-js/plugin-polyfill@1.0.0-rc.9
  - @modern-js/server-utils@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.8
  - @modern-js/hmr-client@1.0.0-rc.8
  - @modern-js/server-plugin@1.0.0-rc.8
  - @modern-js/plugin-polyfill@1.0.0-rc.8
  - @modern-js/server-utils@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.7
  - @modern-js/hmr-client@1.0.0-rc.7
  - @modern-js/server-plugin@1.0.0-rc.7
  - @modern-js/plugin-polyfill@1.0.0-rc.7
  - @modern-js/server-utils@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.6
  - @modern-js/hmr-client@1.0.0-rc.6
  - @modern-js/server-plugin@1.0.0-rc.6
  - @modern-js/plugin-polyfill@1.0.0-rc.6
  - @modern-js/server-utils@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.5
  - @modern-js/hmr-client@1.0.0-rc.5
  - @modern-js/server-plugin@1.0.0-rc.5
  - @modern-js/plugin-polyfill@1.0.0-rc.5
  - @modern-js/server-utils@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.4
  - @modern-js/hmr-client@1.0.0-rc.4
  - @modern-js/server-plugin@1.0.0-rc.4
  - @modern-js/plugin-polyfill@1.0.0-rc.4
  - @modern-js/server-utils@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/core@1.0.0-rc.3
  - @modern-js/hmr-client@1.0.0-rc.3
  - @modern-js/server-plugin@1.0.0-rc.3
  - @modern-js/plugin-polyfill@1.0.0-rc.3
  - @modern-js/server-utils@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
