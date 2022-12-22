# @modern-js/prod-server

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 7879e8f711: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- d032d49e09: export createHandle
  导出 createHandle 函数
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 73cd29dd9f: fix(server): add favicon fallback handler

  fix(server): 添加 favicon 兜底处理逻辑

- cce8ecee2d: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- 18aaf42249: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [7879e8f711]
- Updated dependencies [6aca875011]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12cf8f]
- Updated dependencies [7efeed4]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb843]
- Updated dependencies [ea7cf06257]
- Updated dependencies [bbe4c4ab64]
- Updated dependencies [e4558a0bc4]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.6
  - @modern-js/server-core@2.0.0-beta.6

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 7879e8f: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- d032d49e09: export createHandle
  导出 createHandle 函数
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 73cd29dd9f: fix(server): add favicon fallback handler

  fix(server): 添加 favicon 兜底处理逻辑

- cce8ecee2d: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- 18aaf42249: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [7879e8f]
- Updated dependencies [6aca875]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12c]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb843]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.4
  - @modern-js/server-core@2.0.0-beta.4

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- d032d49e09: export createHandle
  导出 createHandle 函数
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 73cd29dd9f: fix(server): add favicon fallback handler

  fix(server): 添加 favicon 兜底处理逻辑

- cce8ece: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- 18aaf42249: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [6aca875]
- Updated dependencies [15bf09d9c8]
- Updated dependencies [2e60319]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.3
  - @modern-js/server-core@2.0.0-beta.3

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- d032d49: export createHandle
  导出 createHandle 函数
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 40ed587: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 73cd29dd9f: fix(server): add favicon fallback handler

  fix(server): 添加 favicon 兜底处理逻辑

- 18aaf42: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [15bf09d9c8]
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/server-core@2.0.0-beta.2
  - @modern-js/utils@2.0.0-beta.2

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- d032d49: export createHandle
  导出 createHandle 函数
- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 40ed587: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 73cd29dd9f: fix(server): add favicon fallback handler

  fix(server): 添加 favicon 兜底处理逻辑

- 18aaf42: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 14b712d: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [15bf09d9c8]
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [abf3421]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712d]
  - @modern-js/server-core@2.0.0-beta.1
  - @modern-js/utils@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- c9e800d39: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be95: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabf: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 102d32e4b: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 3bbea92b2: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 73cd29dd9: fix(server): add favicon fallback handler

  fix(server): 添加 favicon 兜底处理逻辑

- 14b712d: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

- Updated dependencies [15bf09d9c]
- Updated dependencies [edd1cfb1a]
- Updated dependencies [cc971eabf]
- Updated dependencies [5b9049f]
- Updated dependencies [b8bbe036c]
- Updated dependencies [d5a31df78]
- Updated dependencies [dda38c9]
- Updated dependencies [3bbea92b2]
- Updated dependencies [abf3421]
- Updated dependencies [543be95]
- Updated dependencies [14b712d]
  - @modern-js/server-core@2.0.0-beta.0
  - @modern-js/utils@2.0.0-beta.0

## 1.21.2

### Patch Changes

- Updated dependencies [9d4c0ba]
  - @modern-js/server-core@1.21.2
  - @modern-js/utils@1.21.2

## 1.21.1

### Patch Changes

- @modern-js/server-core@1.21.1
- @modern-js/utils@1.21.1

## 1.21.0

### Patch Changes

- f51c59a: feat: remove node internal package like fs or path which import by ssr runtime
  feat: 删除在 ssr runtime 中引用的 node 内部包
- 8f3674a: chore: reduce parameters for dev-server & update default config value in builder startDevServer

  chore: 缩简 devServer 配置定义 & 更新 builder startDevServer 方法 config 默认值

- 519965e: fix: should not do render if set location header and 302 status in middleware
  fix: 如果在 middleware 中设置了 location 头和 302 状态码，则不应该走渲染逻辑
- 67d80b7: fix(prod-server): failed to match URL which ends with ".html"

  fix(prod-server): 修复无法匹配到以 ".html" 结尾的 URL 的问题

  - @modern-js/server-core@1.21.0
  - @modern-js/utils@1.21.0

## 1.20.1

### Patch Changes

- Updated dependencies [49515c5]
  - @modern-js/utils@1.20.1
  - @modern-js/server-core@1.20.1

## 1.20.0

### Patch Changes

- baf7337: fix: console error message if error stack not exist
  fix: 如果错误堆栈不存在，则输出错误信息
- Updated dependencies [d5d570b]
- Updated dependencies [4ddc185]
- Updated dependencies [df8ee7e]
- Updated dependencies [8c05089]
  - @modern-js/utils@1.20.0
  - @modern-js/server-core@1.20.0

## 1.19.0

### Patch Changes

- 1903f68: fix(server): failed to access static files when output.assetPrefix ends with /

  fix(server): 修复 output.assetPrefix 以 / 结尾时无法正确访问的问题

  - @modern-js/server-core@1.19.0
  - @modern-js/utils@1.19.0

## 1.18.1

### Patch Changes

- 3586707: fix: the compaire-version throw error make the supportModern error
  fix: compaire-version 的抛错导致 supportModern 失败
- f6a3aa1: feat: support etag in dev server by default
  feat: 开发环境默认支持 etag 功能
- 9f7bfa6: fix: fix the problem that the response header cannot be redirected when setting in ssr
  fix: 修复在 SSR 中设置响应头却无法重定向的问题
- Updated dependencies [9fcfbd4]
- Updated dependencies [6c2c745]
  - @modern-js/utils@1.18.1
  - @modern-js/server-core@1.18.1

## 1.18.0

### Patch Changes

- 3d5e3a5: chore: get api mode from bff core
  chore: 从 bff core 中获取 api mode
- Updated dependencies [8280920]
- Updated dependencies [3d5e3a5]
- Updated dependencies [5227370]
- Updated dependencies [7928bae]
  - @modern-js/utils@1.18.0
  - @modern-js/server-core@1.18.0

## 1.17.0

### Patch Changes

- Updated dependencies [1b9176f]
- Updated dependencies [77d3a38]
- Updated dependencies [151329d]
- Updated dependencies [5af9472]
- Updated dependencies [6b6a534]
- Updated dependencies [6b43a2b]
- Updated dependencies [a7be124]
- Updated dependencies [31547b4]
  - @modern-js/utils@1.17.0
  - @modern-js/server-core@1.17.0

## 1.16.0

### Patch Changes

- 81c66e4a4: fix: compatibility issues of dev server in iOS 10

  fix: 修复 dev server 代码在 iOS 10 下的兼容性问题

- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
  - @modern-js/utils@1.16.0
  - @modern-js/server-core@1.16.0

## 1.15.0

### Patch Changes

- c087148: chore: remove cookie in error log
  chore: 删除错误日志中的 cookie 信息
- Updated dependencies [8658a78]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [37cd159]
  - @modern-js/utils@1.15.0
  - @modern-js/server-core@1.15.0

## 1.2.2

### Patch Changes

- 0e28456: fix assets prefix bug in prod env
- 44e3bb1: feat: support response headers
  feat: 支持设置响应头
  - @modern-js/server-core@1.4.1
  - @modern-js/utils@1.8.0

## 1.2.1

### Patch Changes

- 2ed8f7d: fix: the \_SERVER_DATA injection twice causes the prod-server route error.
  fix: \_SERVER_DATA 二次注入，导致服务器路由错误
- Updated dependencies [4fc801f]
- Updated dependencies [c8614b8]
  - @modern-js/utils@1.8.0
  - @modern-js/server-core@1.4.1

## 1.2.0

### Minor Changes

- 3d64b2f: feat: prod-server supports that load server env from .env.\*

  feat: prod-server 支持从 .env.\* 文件加载服务器环境变量

### Patch Changes

- 7b902b3: feat: support ListenOptions for prod-server

  feat: server 支持传入 listernOptions 参数

- Updated dependencies [a27ab8d]
  - @modern-js/server-core@1.4.1
  - @modern-js/utils@1.7.12

## 1.1.9

### Patch Changes

- f29e9ba: feat: simplify context usage, no longer depend on containers
- 2dacc89: support set header & status in render
- Updated dependencies [77a8e9e]
- Updated dependencies [f29e9ba]
- Updated dependencies [a90bc96]
  - @modern-js/server-core@1.4.0
  - @modern-js/utils@1.7.9

## 1.1.8

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
  - @modern-js/server-core@1.3.5

## 1.1.7

### Patch Changes

- d4afeba71: fix: remove cors for prod-server

## 1.1.6

### Patch Changes

- 430d417e: optimize server side hot reload
- Updated dependencies [6451a098]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/utils@1.7.6
  - @modern-js/server-core@1.3.5

## 1.1.5

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- 86fe5a657: support handle server context init error
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/server-core@1.3.5
  - @modern-js/utils@1.7.3

## 1.1.4

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/server-core@1.3.4

## 1.1.3

### Patch Changes

- a4c5fe78: fix test case
- 6fa74d5f: add internal metrics and logger
- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/utils@1.7.0
  - @modern-js/server-core@1.3.3

## 1.1.2

### Patch Changes

- a0499e4f: fix: throw error in server config
- 592edabc: feat: prebundle url-join,mime-types,json5,fast-glob,globby,ora,inquirer
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- Updated dependencies [2d155c4c]
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
  - @modern-js/server-core@1.3.2

## 1.1.1

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- Updated dependencies [b8599d09]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/server-core@1.3.1

## 1.1.0

### Minor Changes

- d2d1d6b2: feat: support server config

### Patch Changes

- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/utils@1.4.0
  - @modern-js/server-core@1.3.0

## 1.0.6

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- 132f7b53: feat: move config declarations to @modern-js/core
- Updated dependencies [bebb39b6]
- Updated dependencies [132f7b53]
  - @modern-js/server-core@1.2.5
  - @modern-js/utils@1.3.7

## 1.0.5

### Patch Changes

- d2d0fa11: fix: missing devServer.proxy typing
- Updated dependencies [a8df060e]
- Updated dependencies [c2046f37]
- Updated dependencies [18db013a]
  - @modern-js/server-core@1.2.4
  - @modern-js/utils@1.3.6

## 1.0.4

### Patch Changes

- d95f28c3: should enable babel register before server plugin require
- d95f28c3: remove server hook when api only
- 0923c182: fix static handler when static file not exist
- 2008fdbd: convert two packages server part, support server load plugin itself
- ca0bcf13: publish prod-server local
- Updated dependencies [5bf5868d]
- Updated dependencies [d95f28c3]
- Updated dependencies [2e8dec93]
- Updated dependencies [2008fdbd]
- Updated dependencies [2e8dec93]
  - @modern-js/utils@1.3.5
  - @modern-js/server-core@1.2.3

## 1.0.2

### Patch Changes

- a78e32d8: remove server hook when api only
- e11eaafc: fix runner error in dev
- cbba492b: add serverless pre-render unit-test
- 59010b7a: rewrite server lifecycle, add unit test
- Updated dependencies [cc5e8001]
- Updated dependencies [2520ea86]
- Updated dependencies [db43dce6]
- Updated dependencies [e81fd9b7]
- Updated dependencies [1c411e71]
  - @modern-js/core@1.4.6
  - @modern-js/utils@1.3.4

## 1.0.1

### Patch Changes

- 02fb4146: support product server
- Updated dependencies [969f172f]
- Updated dependencies [4c792f68]
- Updated dependencies [4b5d4bf4]
- Updated dependencies [62f5b8c8]
- Updated dependencies [55e18278]
- Updated dependencies [4499a674]
- Updated dependencies [403f5169]
- Updated dependencies [a7f42f48]
  - @modern-js/core@1.4.4
  - @modern-js/utils@1.3.3
