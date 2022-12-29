# @modern-js/runtime

## 2.0.0-beta.8

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR

### Patch Changes

- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- Updated dependencies [edd1cfb1af]
- Updated dependencies [6bda14ed71]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/utils@2.0.0-beta.8
  - @modern-js/types@2.0.0-beta.8
  - @modern-js/plugin@2.0.0-beta.8

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR

### Patch Changes

- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- Updated dependencies [edd1cfb1af]
- Updated dependencies [6bda14ed71]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/utils@2.0.0-beta.7
  - @modern-js/types@2.0.0-beta.7
  - @modern-js/plugin@2.0.0-beta.7

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- df7ee2d: feat: runtime user config types extends
  feat: runtime 用户配置类型扩展
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 2344eb26ed: fix: bootstrap function params type define

  fix: 修复 bootstrap 函数参数类型定义

- a11fcf8b50: feat: fallback logic of streaming ssr
  feat: streaming ssr 降级逻辑
- a93159440e: feat: support modify routes for csr app
  feat: 支持 modifyRoutes API
- e7ce0636d1: fix: root layout css chunks should't be loaded
  fix: 不应该加载 root layout 的 css chunks
- b18fa8f3ed: feat: remove @loadable/component in streaming ssr
  feat: 移除 streaming ssr 中的 @loadable/component 逻辑
- 50d4675e5b: fix: add document cli export

  fix: 增加 document cli 插件的导出

- 6604f1b8b3: feat: support router basename
  feat: router 插件支持设置 basename
- fda836fe8a: feat: support `models`,`initialState` config for state plugin
  feat: state 插件支持`model`,`initialState` 配置
- d6bc321747: fix: the Document.tsx missed hmr

  fix: Document.tsx 未能引发 hmr

- 3e57f2bd58: feat: add document feature with plugin

  feat: 增加 document 功能插件

- 2e6031955e: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- c5798d284f: fix(runtime): apply babel-plugin-ssr-loader-id when SSR is not used

  fix(runtime): 在未启动 SSR 时需要注册 babel-plugin-ssr-loader-id

- fbf5eed5aa: fix: fix ssg failure due to lack of Web Response API
  fix: 修复因为缺少 Web Response API 而导致 ssg 失败
- a2509bfbdb: feat: bump esbuild from 0.14.38 to 0.15.7

  feat: 将 esbuild 从 0.14.38 版本升级至 0.15.7 版本

- a7c68832b3: fix: only register babel-plugin-ssr-loader-id when SSR is enabled

  fix: 仅在开启 SSR 的场景下注册 babel-plugin-ssr-loader-id

- 425e57092d: feat: export react-router-dom/server staticRouter
  feat: 导出 react-router-dom/server 的 staticRouter 组件
- e4357f1856: fix: change default document file and name

  fix: 重置默认的 document 文件和文件名

- 4369648ae2: fix: fix html template of streaming ssr
  fix: 修复流式渲染的 html 模版
- 92c0994468: chore: remove `registerPrefetch`
  chore: 移除 `registerPrefetch`
- 2cc2eb35ba: fix: fix state plugin config
  fix: 修复 state 插件 config 参数
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 92004d1906: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 60d5378632: fix: function extname should not return array
  fix: 函数 extname 不应该返回一个数组
- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 21d7521: fix: the Body not use Root jsx

  fix: 修复 Body 里的 Root 引用格式

- 9144c21d27: fix: esbuild config use file

  fix: 更改 esbuild 读取指定 ts 配置

- 18aaf42249: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 34702d5d47: feat: support internal env vars: metaName_TARGET
  feat: 支持内置环境变量 metaName_TARGET
- fcace5b5b9: fix: remove overmuch `@modernjs/utils` dependency import in ssr runtime & SSR hydrate error
  fix: 去除 ssr 运行时过多的 `@modernjs/utils` 依赖引入 & SSR hydrate 错误
- Updated dependencies [7879e8f711]
- Updated dependencies [6aca875011]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12cf8f]
- Updated dependencies [7efeed4]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [87c1ff86b9]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb843]
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06257]
- Updated dependencies [bbe4c4ab64]
- Updated dependencies [e4558a0bc4]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/types@2.0.0-beta.6
  - @modern-js/utils@2.0.0-beta.6
  - @modern-js/plugin@2.0.0-beta.6

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 2344eb26ed: fix: bootstrap function params type define

  fix: 修复 bootstrap 函数参数类型定义

- a11fcf8b50: feat: fallback logic of streaming ssr
  feat: streaming ssr 降级逻辑
- a931594: feat: support modify routes for csr app
  feat: 支持 modifyRoutes API
- e7ce063: fix: root layout css chunks should't be loaded
  fix: 不应该加载 root layout 的 css chunks
- b18fa8f3ed: feat: remove @loadable/component in streaming ssr
  feat: 移除 streaming ssr 中的 @loadable/component 逻辑
- 50d4675: fix: add document cli export

  fix: 增加 document cli 插件的导出

- 6604f1b: feat: support router basename
  feat: router 插件支持设置 basename
- fda836f: feat: support `models`,`initialState` config for state plugin
  feat: state 插件支持`model`,`initialState` 配置
- d6bc321: fix: the Document.tsx missed hmr

  fix: Document.tsx 未能引发 hmr

- 3e57f2bd58: feat: add document feature with plugin

  feat: 增加 document 功能插件

- 2e6031955e: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- c5798d2: fix(runtime): apply babel-plugin-ssr-loader-id when SSR is not used

  fix(runtime): 在未启动 SSR 时需要注册 babel-plugin-ssr-loader-id

- fbf5eed5aa: fix: fix ssg failure due to lack of Web Response API
  fix: 修复因为缺少 Web Response API 而导致 ssg 失败
- a2509bfbdb: feat: bump esbuild from 0.14.38 to 0.15.7

  feat: 将 esbuild 从 0.14.38 版本升级至 0.15.7 版本

- a7c6883: fix: only register babel-plugin-ssr-loader-id when SSR is enabled

  fix: 仅在开启 SSR 的场景下注册 babel-plugin-ssr-loader-id

- 425e57092d: feat: export react-router-dom/server staticRouter
  feat: 导出 react-router-dom/server 的 staticRouter 组件
- e4357f1856: fix: change default document file and name

  fix: 重置默认的 document 文件和文件名

- 4369648ae2: fix: fix html template of streaming ssr
  fix: 修复流式渲染的 html 模版
- 92c0994468: chore: remove `registerPrefetch`
  chore: 移除 `registerPrefetch`
- 2cc2eb3: fix: fix state plugin config
  fix: 修复 state 插件 config 参数
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 92004d1906: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 60d5378632: fix: function extname should not return array
  fix: 函数 extname 不应该返回一个数组
- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 9144c21: fix: esbuild config use file

  fix: 更改 esbuild 读取指定 ts 配置

- 18aaf42249: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 34702d5: feat: support internal env vars: metaName_TARGET
  feat: 支持内置环境变量 metaName_TARGET
- fcace5b5b9: fix: remove overmuch `@modernjs/utils` dependency import in ssr runtime & SSR hydrate error
  fix: 去除 ssr 运行时过多的 `@modernjs/utils` 依赖引入 & SSR hydrate 错误
- Updated dependencies [7879e8f]
- Updated dependencies [6aca875]
- Updated dependencies [2e6031955e]
- Updated dependencies [7b7d12c]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [87c1ff86b9]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb843]
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/types@2.0.0-beta.4
  - @modern-js/utils@2.0.0-beta.4
  - @modern-js/plugin@2.0.0-beta.4

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 2344eb26ed: fix: bootstrap function params type define

  fix: 修复 bootstrap 函数参数类型定义

- a11fcf8b50: feat: fallback logic of streaming ssr
  feat: streaming ssr 降级逻辑
- e7ce063: fix: root layout css chunks should't be loaded
  fix: 不应该加载 root layout 的 css chunks
- b18fa8f3ed: feat: remove @loadable/component in streaming ssr
  feat: 移除 streaming ssr 中的 @loadable/component 逻辑
- 6604f1b: feat: support router basename
  feat: router 插件支持设置 basename
- fda836f: feat: support `models`,`initialState` config for state plugin
  feat: state 插件支持`model`,`initialState` 配置
- 3e57f2bd58: feat: add document feature with plugin

  feat: 增加 document 功能插件

- 2e60319: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- fbf5eed5aa: fix: fix ssg failure due to lack of Web Response API
  fix: 修复因为缺少 Web Response API 而导致 ssg 失败
- a2509bfbdb: feat: bump esbuild from 0.14.38 to 0.15.7

  feat: 将 esbuild 从 0.14.38 版本升级至 0.15.7 版本

- 425e570: feat: export react-router-dom/server staticRouter
  feat: 导出 react-router-dom/server 的 staticRouter 组件
- e4357f1: fix: change default document file and name

  fix: 重置默认的 document 文件和文件名

- 4369648ae2: fix: fix html template of streaming ssr
  fix: 修复流式渲染的 html 模版
- 92c0994468: chore: remove `registerPrefetch`
  chore: 移除 `registerPrefetch`
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 92004d1906: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 60d5378632: fix: function extname should not return array
  fix: 函数 extname 不应该返回一个数组
- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 18aaf42249: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- 34702d5: feat: support internal env vars: metaName_TARGET
  feat: 支持内置环境变量 metaName_TARGET
- fcace5b5b9: fix: remove overmuch `@modernjs/utils` dependency import in ssr runtime & SSR hydrate error
  fix: 去除 ssr 运行时过多的 `@modernjs/utils` 依赖引入 & SSR hydrate 错误
- Updated dependencies [6aca875]
- Updated dependencies [2e60319]
- Updated dependencies [92f0eade39]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [87c1ff86b9]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb]
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.3
  - @modern-js/types@2.0.0-beta.3
  - @modern-js/plugin@2.0.0-beta.3

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 2344eb2: fix: bootstrap function params type define

  fix: 修复 bootstrap 函数参数类型定义

- a11fcf8: feat: fallback logic of streaming ssr
  feat: streaming ssr 降级逻辑
- b18fa8f3ed: feat: remove @loadable/component in streaming ssr
  feat: 移除 streaming ssr 中的 @loadable/component 逻辑
- 3e57f2b: feat: add document feature with plugin

  feat: 增加 document 功能插件

- fbf5eed: fix: fix ssg failure due to lack of Web Response API
  fix: 修复因为缺少 Web Response API 而导致 ssg 失败
- a2509bfbdb: feat: bump esbuild from 0.14.38 to 0.15.7

  feat: 将 esbuild 从 0.14.38 版本升级至 0.15.7 版本

- e4357f1: fix: change default document file and name

  fix: 重置默认的 document 文件和文件名

- 4369648ae2: fix: fix html template of streaming ssr
  fix: 修复流式渲染的 html 模版
- 92c0994: chore: remove `registerPrefetch`
  chore: 移除 `registerPrefetch`
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 92004d1: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- 40ed587: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 60d5378632: fix: function extname should not return array
  fix: 函数 extname 不应该返回一个数组
- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 18aaf42: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- fcace5b5b9: fix: remove overmuch `@modernjs/utils` dependency import in ssr runtime & SSR hydrate error
  fix: 去除 ssr 运行时过多的 `@modernjs/utils` 依赖引入 & SSR hydrate 错误
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed587]
- Updated dependencies [87c1ff8]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [f179749]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.2
  - @modern-js/types@2.0.0-beta.2
  - @modern-js/plugin@2.0.0-beta.2

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- c9e800d39a: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 2344eb2: fix: bootstrap function params type define

  fix: 修复 bootstrap 函数参数类型定义

- a11fcf8: feat: fallback logic of streaming ssr
  feat: streaming ssr 降级逻辑
- b18fa8f: feat: remove @loadable/component in streaming ssr
  feat: 移除 streaming ssr 中的 @loadable/component 逻辑
- 3e57f2b: feat: add document feature with plugin

  feat: 增加 document 功能插件

- fbf5eed: fix: fix ssg failure due to lack of Web Response API
  fix: 修复因为缺少 Web Response API 而导致 ssg 失败
- a2509bfbdb: feat: bump esbuild from 0.14.38 to 0.15.7

  feat: 将 esbuild 从 0.14.38 版本升级至 0.15.7 版本

- 4369648ae2: fix: fix html template of streaming ssr
  fix: 修复流式渲染的 html 模版
- 92c0994: chore: remove `registerPrefetch`
  chore: 移除 `registerPrefetch`
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 92004d1: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- 40ed587: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 60d5378632: fix: function extname should not return array
  fix: 函数 extname 不应该返回一个数组
- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- 18aaf42: fix: fix server loader redirects
  fix: 修复 server loader 重定向错误
- fcace5b5b9: fix: remove overmuch `@modernjs/utils` dependency import in ssr runtime & SSR hydrate error
  fix: 去除 ssr 运行时过多的 `@modernjs/utils` 依赖引入 & SSR hydrate 错误
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed587]
- Updated dependencies [87c1ff8]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9]
- Updated dependencies [102d32e4ba]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [f179749]
- Updated dependencies [abf3421]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712d]
  - @modern-js/utils@2.0.0-beta.1
  - @modern-js/types@2.0.0-beta.1
  - @modern-js/plugin@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- c9e800d39: feat: support React18 streaming SSR
  feat: 支持 React18 流式 SSR
- 543be95: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- b18fa8f: feat: remove @loadable/component in streaming ssr
  feat: 移除 streaming ssr 中的 @loadable/component 逻辑
- a2509bf: feat: bump esbuild from 0.14.38 to 0.15.7

  feat: 将 esbuild 从 0.14.38 版本升级至 0.15.7 版本

- 4369648ae: fix: fix html template of streaming ssr
  fix: 修复流式渲染的 html 模版
- 6bda14ed7: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 60d5378: fix: function extname should not return array
  fix: 函数 extname 不应该返回一个数组
- 8b8e1bb57: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- fcace5b5b: fix: remove overmuch `@modernjs/utils` dependency import in ssr runtime & SSR hydrate error
  fix: 去除 ssr 运行时过多的 `@modernjs/utils` 依赖引入 & SSR hydrate 错误
- Updated dependencies [edd1cfb1a]
- Updated dependencies [cc971eabf]
- Updated dependencies [5b9049f]
- Updated dependencies [6bda14ed7]
- Updated dependencies [b8bbe036c]
- Updated dependencies [d5a31df78]
- Updated dependencies [dda38c9]
- Updated dependencies [102d32e4b]
- Updated dependencies [8b8e1bb57]
- Updated dependencies [3bbea92b2]
- Updated dependencies [abf3421]
- Updated dependencies [543be95]
- Updated dependencies [14b712d]
  - @modern-js/utils@2.0.0-beta.0
  - @modern-js/types@2.0.0-beta.0
  - @modern-js/plugin@2.0.0-beta.0

## 1.21.2

### Patch Changes

- Updated dependencies [9d4c0ba]
  - @modern-js/plugin@1.21.2
  - @modern-js/webpack@1.21.2
  - @modern-js/utils@1.21.2

## 1.21.1

### Patch Changes

- @modern-js/webpack@1.21.1
- @modern-js/plugin@1.21.1
- @modern-js/utils@1.21.1

## 1.21.0

### Patch Changes

- f51c59a: feat: remove node internal package like fs or path which import by ssr runtime
  feat: 删除在 ssr runtime 中引用的 node 内部包
- 4c1f3a4: fix: runtime export field

  fix: 修复 runtime 包导出字段

- 4c1f3a4: fix: state runtime plugin params

  fix: state 插件参数格式

- c40fc4b: fix: add missing ssr exports from runtime ssr plugin
  fix: 补充 runtime ssr 插件中丢失的 ssr 导出
- Updated dependencies [17d1672]
- Updated dependencies [28f0a4f]
- Updated dependencies [b0597e3]
  - @modern-js/webpack@1.21.0
  - @modern-js/plugin@1.21.0
  - @modern-js/utils@1.21.0

## 1.20.1

### Patch Changes

- Updated dependencies [49515c5]
  - @modern-js/utils@1.20.1
  - @modern-js/webpack@1.20.1
  - @modern-js/plugin@1.20.1

## 1.20.0

### Patch Changes

- b57d5ff: fix: ssr runtime plugin need default config
  fix: ssr 运行时插件需要传入默认配置
- 715df7a: feat: support loadable scripts add crossorigin attribute
  feat: SSR 支持 loadable 脚本添加 crossorigin 属性
- Updated dependencies [d5d570b]
- Updated dependencies [4ddc185]
- Updated dependencies [df8ee7e]
- Updated dependencies [077aef8]
- Updated dependencies [8c05089]
  - @modern-js/utils@1.20.0
  - @modern-js/webpack@1.20.0
  - @modern-js/plugin@1.20.0

## 1.19.0

### Patch Changes

- @modern-js/webpack@1.19.0
- @modern-js/plugin@1.19.0
- @modern-js/utils@1.19.0

## 1.18.1

### Patch Changes

- Updated dependencies [c1a4d9b]
- Updated dependencies [9fcfbd4]
- Updated dependencies [6c2c745]
  - @modern-js/plugin@1.18.1
  - @modern-js/utils@1.18.1
  - @modern-js/webpack@1.18.1

## 1.18.0

### Patch Changes

- Updated dependencies [8280920]
- Updated dependencies [5227370]
- Updated dependencies [7928bae]
  - @modern-js/utils@1.18.0
  - @modern-js/webpack@1.18.0
  - @modern-js/plugin@1.18.0

## 1.17.0

### Patch Changes

- 77d3a38: feat: remove `.runtime-exports/index.js` export

  feat: 移除 `.runtime-exports/index.js` 导出

- 492437f: fix: runtime type

  fix: 修复 runtime 类型定义

- c3d4a6a: feat: support react 18 ssr
  feat: 支持 React 18 下使用 SSR
- Updated dependencies [1b9176f]
- Updated dependencies [77d3a38]
- Updated dependencies [151329d]
- Updated dependencies [5af9472]
- Updated dependencies [6b6a534]
- Updated dependencies [6b43a2b]
- Updated dependencies [a7be124]
- Updated dependencies [31547b4]
  - @modern-js/utils@1.17.0
  - @modern-js/webpack@1.17.0
  - @modern-js/plugin@1.17.0

## 1.16.1

### Patch Changes

- fix: runtime type

  fix: 修复 runtime 类型定义

## 1.16.0

### Minor Changes

- 1100dd58c: chore: support react 18

  chore: 支持 React 18

### Patch Changes

- a480d6ad0: fix: remove helmet regexp's global tag
  fix: 删除 helmet 中正则匹配的全局标记
- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
  - @modern-js/utils@1.16.0
  - @modern-js/webpack@1.16.0
  - @modern-js/plugin@1.16.0

## 1.15.0

### Patch Changes

- 335c97c: fix: fix runtime context format bug
  fix: 修复 runtimeContext 数据格式化时的问题
- a04a11b: fix: 修复 SSR 物理降级时，获取不到请求上下文的问题
  fix: should get ssrContext anyway if entry is ssr enable
- Updated dependencies [8658a78]
- Updated dependencies [0df4970]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [37cd159]
  - @modern-js/utils@1.15.0
  - @modern-js/webpack@1.15.0
  - @modern-js/plugin@1.15.0

## 1.5.0

### Minor Changes

- 59c941a: chore(runtime): merge `@modern-js/runtime-core` to `@modern-js/runtime`

  chore(runtime): 合并 `@modern-js/runtime-core` 到 `@modern-js/runtime`

### Patch Changes

- e0cd14a: feat: support runtime router and state type

  feat: 支持在 `modern.config.ts` 中提示 `runtime.router` and `runtime.state` 类型

- 287ac8b: fix(runtime): router plugin replace error

  fix(runtime): router 插件 replace 报错

- Updated dependencies [79e83ef]
- Updated dependencies [5f1a231]
- Updated dependencies [22f4dca]
- Updated dependencies [7b9067f]
  - @modern-js/utils@1.9.0
  - @modern-js/webpack@1.12.4

## 1.4.3

### Patch Changes

- b27d299: fix: runtime plugin module path

  fix: 修复内置 runtime 插件模块导入路径

- Updated dependencies [4f1889d]
  - @modern-js/utils@1.8.1
  - @modern-js/webpack@1.12.3
  - @modern-js/runtime-core@1.5.4

## 1.4.2

### Patch Changes

- b28372c: fix(runtime): fix model types for effects

  fix(runtime): 修复因为 runtime 包合并导致的 model effects 类型不生效问题

- Updated dependencies [9a173a7]
  - @modern-js/webpack@1.12.3
  - @modern-js/runtime-core@1.5.4
  - @modern-js/utils@1.8.0

## 1.4.1

### Patch Changes

- 132812542: fix: plugin runtime dependencies

  fix: 修复 runtime 插件依赖

## 1.4.0

### Minor Changes

- 4fc801f: chore(runtime): merge `@modern-js/plugin-state` to `@modern-js/runtime`

  chore(runtime): 合并 `@modern-js/plugin-state` 到 `@modern-js/runtime`

- 4fc801f: chore(runtime): merge `@modern-js/plugin-router` to `@modern-js/runtime`

  chore(runtime): 合并 `@modern-js/plugin-router` 到 `@modern-js/runtime`

- 4fc801f: chore(runtime): merge `@modern-js/plugin-ssr` to `@modern-js/runtime`

  chore(runtime): 合并 `@modern-js/plugin-ssr` 到 `@modern-js/runtime`

- 4fc801f: chore(runtime): remove `@modern-js/create-request` from `@modern-js/runtime`

  chore(runtime): `@modern-js/runtime` 中移除 `@modern-js/create-request` 依赖

- 16eaebd: fix: package exports field

  fix: 修复包导出字段

- 8f046e8: chore(bff): remove `@modern-js/bff-runtime` from `@modern-js/runtime` dependence

  chore(bff): `@modern-js/runtime` 中移除 `@modern-js/bff-runtime` 依赖

### Patch Changes

- 1421965: fix: ssg build error when multi entries
  fix: 修复多入口下 SSG 构建错误
- b8ea9cd: fix runtime ssr exports
- c8614b8: fix: using typeof window to determine the browser environment is not accurate
  fix: 使用 typeof windows 判断浏览器环境不够准确
- Updated dependencies [1421965]
- Updated dependencies [02647d2]
- Updated dependencies [4fc801f]
- Updated dependencies [9d60891]
- Updated dependencies [e4b73b2]
- Updated dependencies [c8614b8]
- Updated dependencies [df73691]
  - @modern-js/webpack@1.12.2
  - @modern-js/utils@1.8.0
  - @modern-js/runtime-core@1.5.4

## 1.3.5

### Patch Changes

- 8d0f1b9: feat: rumtime config types
  feat: 补充 runtime 配置类型
- Updated dependencies [33cebd2]
  - @modern-js/plugin-ssr@1.5.0
  - @modern-js/plugin-router@1.2.16
  - @modern-js/plugin-state@1.2.10
  - @modern-js/runtime-core@1.5.3
  - @modern-js/utils@1.7.12

## 1.3.4

### Patch Changes

- 3050acc: add styled-components alias
- Updated dependencies [77a8e9e]
- Updated dependencies [43b2224]
- Updated dependencies [dc37349]
- Updated dependencies [77a8e9e]
- Updated dependencies [f29e9ba]
- Updated dependencies [2dacc89]
- Updated dependencies [a90bc96]
  - @modern-js/bff-runtime@1.3.0
  - @modern-js/plugin-ssr@1.4.6
  - @modern-js/runtime-core@1.5.2
  - @modern-js/plugin-router@1.2.16
  - @modern-js/create-request@1.3.0
  - @modern-js/utils@1.7.9
  - @modern-js/plugin-state@1.2.10

## 1.3.3

### Patch Changes

- 8d0eb81f5: add styled-components alias

## 1.3.2

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
- Updated dependencies [a1198d509]
  - @modern-js/plugin-router@1.2.15
  - @modern-js/plugin-ssr@1.4.5
  - @modern-js/plugin-state@1.2.10
  - @modern-js/runtime-core@1.4.9
  - @modern-js/bff-runtime@1.2.4
  - @modern-js/create-request@1.2.11

## 1.3.1

### Patch Changes

- 37250cb8f: feat: supply `AppConfig` types
- Updated dependencies [6c8ab42dd]
- Updated dependencies [808baede3]
- Updated dependencies [37250cb8f]
- Updated dependencies [fc43fef39]
- Updated dependencies [a204922e8]
  - @modern-js/plugin-ssr@1.4.4
  - @modern-js/runtime-core@1.4.8
  - @modern-js/plugin-state@1.2.9
  - @modern-js/plugin-router@1.2.14

## 1.3.0

### Minor Changes

- a9f5d170c: fix: @modern-js/runtime/model effects type error

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [97086dde8]
- Updated dependencies [97086dde8]
- Updated dependencies [b80229c79]
- Updated dependencies [5bfb57321]
- Updated dependencies [948cc4436]
  - @modern-js/plugin-router@1.2.14
  - @modern-js/plugin-state@1.2.7
  - @modern-js/runtime-core@1.4.6
  - @modern-js/bff-runtime@1.2.3
  - @modern-js/create-request@1.2.8
  - @modern-js/utils@1.7.3
  - @modern-js/plugin-ssr@1.3.2

## 1.2.9

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [0e0537005]
- Updated dependencies [69a728375]
- Updated dependencies [0f86e133b]
- Updated dependencies [b5943b029]
  - @modern-js/runtime-core@1.4.5
  - @modern-js/utils@1.7.2
  - @modern-js/plugin-ssr@1.3.1
  - @modern-js/plugin-router@1.2.13
  - @modern-js/create-request@1.2.7
  - @modern-js/plugin-state@1.2.6

## 1.2.7

### Patch Changes

- 6c1438d2: fix: missing peer deps warnings
- 123e432d: uglify ssr bundle for treeshaking
- Updated dependencies [2d155c4c]
- Updated dependencies [a0475f1a]
- Updated dependencies [123e432d]
- Updated dependencies [6c1438d2]
- Updated dependencies [e5a9b26d]
- Updated dependencies [0b26b93b]
- Updated dependencies [123e432d]
- Updated dependencies [f9f66ef9]
- Updated dependencies [592edabc]
- Updated dependencies [895fa0ff]
- Updated dependencies [3578913e]
- Updated dependencies [0fccff68]
- Updated dependencies [1c3beab3]
  - @modern-js/utils@1.6.0
  - @modern-js/plugin-ssr@1.2.8
  - @modern-js/plugin-state@1.2.5
  - @modern-js/plugin-router@1.2.11
  - @modern-js/runtime-core@1.4.3
  - @modern-js/create-request@1.2.5

## 1.2.6

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [e4cec1ce]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/plugin-router@1.2.10
  - @modern-js/plugin-state@1.2.4
  - @modern-js/runtime-core@1.4.2
  - @modern-js/bff-runtime@1.2.2
  - @modern-js/create-request@1.2.4
  - @modern-js/plugin-ssr@1.2.7

## 1.2.5

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- ff73a5cc: fix style-component bugs
- Updated dependencies [bebb39b6]
- Updated dependencies [132f7b53]
- Updated dependencies [c4a7e4a3]
- Updated dependencies [ff73a5cc]
- Updated dependencies [9d4a005b]
  - @modern-js/plugin-router@1.2.8
  - @modern-js/plugin-ssr@1.2.5
  - @modern-js/plugin-state@1.2.3
  - @modern-js/utils@1.3.7

## 1.2.4

### Patch Changes

- 94d02b35: feat(plugin-runtime): convert to new plugin
- 808cec13: fix(plugin-runtime): fix usePlugins error
- 681a1ff9: feat: remove unnecessary peerDependencies
- Updated dependencies [c2046f37]
- Updated dependencies [a2261fed]
- Updated dependencies [cee0efcc]
- Updated dependencies [94d02b35]
- Updated dependencies [57e8ce98]
- Updated dependencies [e31ce644]
- Updated dependencies [681a1ff9]
- Updated dependencies [e8bbc315]
  - @modern-js/utils@1.3.6
  - @modern-js/runtime-core@1.4.0
  - @modern-js/plugin-router@1.2.6
  - @modern-js/plugin-state@1.2.2
  - @modern-js/plugin-ssr@1.2.4

## 1.2.3

### Patch Changes

- 6891e4c2: add theme token some config logic
- 0cd8b592: fix: runtime head and loadable type not found
- Updated dependencies [b376c8d6]
- Updated dependencies [735b2a81]
- Updated dependencies [e62c4efd]
- Updated dependencies [5ed05e65]
- Updated dependencies [735b2a81]
- Updated dependencies [e2a8233f]
  - @modern-js/core@1.4.2
  - @modern-js/plugin-ssr@1.2.2
  - @modern-js/runtime-core@1.2.3

## 1.2.2

### Patch Changes

- d099e5c5: fix error when modify modern.config.js
- 24f616ca: feat: support custom meta info
- Updated dependencies [816fd721]
- Updated dependencies [d9cc5ea9]
- Updated dependencies [bfbea9a7]
- Updated dependencies [bd819a8d]
- Updated dependencies [ec4dbffb]
- Updated dependencies [d099e5c5]
- Updated dependencies [bada2879]
- Updated dependencies [24f616ca]
- Updated dependencies [bd819a8d]
- Updated dependencies [272cab15]
  - @modern-js/plugin-ssr@1.2.1
  - @modern-js/core@1.4.0
  - @modern-js/plugin-router@1.2.2
  - @modern-js/runtime-core@1.2.2
  - @modern-js/utils@1.3.0

## 1.2.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
- Updated dependencies [c3de9882]
- Updated dependencies [33ff48af]
- Updated dependencies [c74597bd]
  - @modern-js/core@1.3.2
  - @modern-js/plugin-router@1.2.1
  - @modern-js/plugin-state@1.2.1
  - @modern-js/runtime-core@1.2.1
  - @modern-js/bff-runtime@1.2.1
  - @modern-js/create-request@1.2.1
  - @modern-js/utils@1.2.2

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 146dcd85: modify server framework plugin hook types and hook context
- 146dcd85: modify server framework plugin hook types
- 146dcd85: fix test case in babel compiler
- Updated dependencies [2da09c69]
- Updated dependencies [5597289b]
- Updated dependencies [fc71e36f]
- Updated dependencies [146dcd85]
- Updated dependencies [a2cb9abc]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
- Updated dependencies [146dcd85]
- Updated dependencies [146dcd85]
  - @modern-js/utils@1.2.0
  - @modern-js/plugin-ssr@1.2.0
  - @modern-js/create-request@1.2.0
  - @modern-js/core@1.3.0
  - @modern-js/bff-runtime@1.2.0
  - @modern-js/runtime-core@1.2.0
  - @modern-js/plugin-router@1.2.0
  - @modern-js/plugin-state@1.2.0

## 1.1.3

### Patch Changes

- b8deff8b: feat: add isBrowser in runtime context
- Updated dependencies [e63591cc]
  - @modern-js/plugin-router@1.1.3
  - @modern-js/runtime-core@1.1.4

## 1.1.2

### Patch Changes

- e51b1db3: feat: support custom sdk, interceptor, headers for bff request
- Updated dependencies [e51b1db3]
- Updated dependencies [4a281912]
- Updated dependencies [4a281912]
- Updated dependencies [b7fb82ec]
- Updated dependencies [eb026119]
  - @modern-js/plugin-ssr@1.1.3
  - @modern-js/create-request@1.1.2
  - @modern-js/runtime-core@1.1.3
  - @modern-js/plugin-router@1.1.2
  - @modern-js/plugin-state@1.1.4
  - @modern-js/utils@1.1.6

## 1.1.1

### Patch Changes

- 0fa83663: support more .env files
- Updated dependencies [6f7fe574]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/core@1.1.2
  - @modern-js/plugin-state@1.1.2
  - @modern-js/runtime-core@1.1.1
  - @modern-js/bff-runtime@1.1.1
  - @modern-js/utils@1.1.2
  - @modern-js/plugin-router@1.1.1
  - @modern-js/plugin-ssr@1.1.1

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/core@1.1.0
  - @modern-js/plugin-router@1.1.0
  - @modern-js/plugin-ssr@1.1.0
  - @modern-js/plugin-state@1.1.0
  - @modern-js/runtime-core@1.1.0
  - @modern-js/bff-runtime@1.1.0
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
  - @modern-js/plugin-router@1.0.0
  - @modern-js/plugin-ssr@1.0.0
  - @modern-js/plugin-state@1.0.0
  - @modern-js/runtime-core@1.0.0
  - @modern-js/bff-runtime@1.0.0
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
  - @modern-js/plugin-router@1.0.0-rc.23
  - @modern-js/plugin-ssr@1.0.0-rc.23
  - @modern-js/plugin-state@1.0.0-rc.23
  - @modern-js/runtime-core@1.0.0-rc.23
  - @modern-js/bff-runtime@1.0.0-rc.23
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
  - @modern-js/plugin-router@1.0.0-rc.22
  - @modern-js/plugin-ssr@1.0.0-rc.22
  - @modern-js/plugin-state@1.0.0-rc.22
  - @modern-js/runtime-core@1.0.0-rc.22
  - @modern-js/bff-runtime@1.0.0-rc.22
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
  - @modern-js/plugin-router@1.0.0-rc.21
  - @modern-js/plugin-ssr@1.0.0-rc.21
  - @modern-js/plugin-state@1.0.0-rc.21
  - @modern-js/runtime-core@1.0.0-rc.21
  - @modern-js/bff-runtime@1.0.0-rc.21
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
  - @modern-js/plugin-router@1.0.0-rc.20
  - @modern-js/plugin-ssr@1.0.0-rc.20
  - @modern-js/plugin-state@1.0.0-rc.20
  - @modern-js/runtime-core@1.0.0-rc.20
  - @modern-js/bff-runtime@1.0.0-rc.20
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
  - @modern-js/plugin-router@1.0.0-rc.19
  - @modern-js/plugin-ssr@1.0.0-rc.19
  - @modern-js/plugin-state@1.0.0-rc.19
  - @modern-js/runtime-core@1.0.0-rc.19
  - @modern-js/bff-runtime@1.0.0-rc.19
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
  - @modern-js/plugin-router@1.0.0-rc.18
  - @modern-js/plugin-ssr@1.0.0-rc.18
  - @modern-js/plugin-state@1.0.0-rc.18
  - @modern-js/runtime-core@1.0.0-rc.18
  - @modern-js/bff-runtime@1.0.0-rc.18
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
  - @modern-js/plugin-router@1.0.0-rc.17
  - @modern-js/plugin-ssr@1.0.0-rc.17
  - @modern-js/plugin-state@1.0.0-rc.17
  - @modern-js/runtime-core@1.0.0-rc.17
  - @modern-js/bff-runtime@1.0.0-rc.17
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
  - @modern-js/plugin-router@1.0.0-rc.16
  - @modern-js/plugin-ssr@1.0.0-rc.16
  - @modern-js/plugin-state@1.0.0-rc.16
  - @modern-js/runtime-core@1.0.0-rc.16
  - @modern-js/bff-runtime@1.0.0-rc.16
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
  - @modern-js/plugin-router@1.0.0-rc.15
  - @modern-js/plugin-ssr@1.0.0-rc.15
  - @modern-js/plugin-state@1.0.0-rc.15
  - @modern-js/runtime-core@1.0.0-rc.15
  - @modern-js/bff-runtime@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.14
  - @modern-js/plugin-router@1.0.0-rc.14
  - @modern-js/plugin-ssr@1.0.0-rc.14
  - @modern-js/plugin-state@1.0.0-rc.14
  - @modern-js/runtime-core@1.0.0-rc.14
  - @modern-js/bff-runtime@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.13
  - @modern-js/plugin-router@1.0.0-rc.13
  - @modern-js/plugin-ssr@1.0.0-rc.13
  - @modern-js/plugin-state@1.0.0-rc.13
  - @modern-js/runtime-core@1.0.0-rc.13
  - @modern-js/bff-runtime@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.12
  - @modern-js/plugin-router@1.0.0-rc.12
  - @modern-js/plugin-ssr@1.0.0-rc.12
  - @modern-js/plugin-state@1.0.0-rc.12
  - @modern-js/runtime-core@1.0.0-rc.12
  - @modern-js/bff-runtime@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.11
  - @modern-js/plugin-router@1.0.0-rc.11
  - @modern-js/plugin-ssr@1.0.0-rc.11
  - @modern-js/plugin-state@1.0.0-rc.11
  - @modern-js/runtime-core@1.0.0-rc.11
  - @modern-js/bff-runtime@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.10
  - @modern-js/plugin-router@1.0.0-rc.10
  - @modern-js/plugin-ssr@1.0.0-rc.10
  - @modern-js/plugin-state@1.0.0-rc.10
  - @modern-js/runtime-core@1.0.0-rc.10
  - @modern-js/bff-runtime@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.9
  - @modern-js/plugin-router@1.0.0-rc.9
  - @modern-js/plugin-ssr@1.0.0-rc.9
  - @modern-js/plugin-state@1.0.0-rc.9
  - @modern-js/runtime-core@1.0.0-rc.9
  - @modern-js/bff-runtime@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.8
  - @modern-js/plugin-router@1.0.0-rc.8
  - @modern-js/plugin-ssr@1.0.0-rc.8
  - @modern-js/plugin-state@1.0.0-rc.8
  - @modern-js/runtime-core@1.0.0-rc.8
  - @modern-js/bff-runtime@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.7
  - @modern-js/plugin-router@1.0.0-rc.7
  - @modern-js/plugin-ssr@1.0.0-rc.7
  - @modern-js/plugin-state@1.0.0-rc.7
  - @modern-js/runtime-core@1.0.0-rc.7
  - @modern-js/bff-runtime@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.6
  - @modern-js/plugin-router@1.0.0-rc.6
  - @modern-js/plugin-ssr@1.0.0-rc.6
  - @modern-js/plugin-state@1.0.0-rc.6
  - @modern-js/runtime-core@1.0.0-rc.6
  - @modern-js/bff-runtime@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.5
  - @modern-js/plugin-router@1.0.0-rc.5
  - @modern-js/plugin-ssr@1.0.0-rc.5
  - @modern-js/plugin-state@1.0.0-rc.5
  - @modern-js/runtime-core@1.0.0-rc.5
  - @modern-js/bff-runtime@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.4
  - @modern-js/plugin-router@1.0.0-rc.4
  - @modern-js/plugin-ssr@1.0.0-rc.4
  - @modern-js/plugin-state@1.0.0-rc.4
  - @modern-js/runtime-core@1.0.0-rc.4
  - @modern-js/bff-runtime@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/core@1.0.0-rc.3
  - @modern-js/plugin-router@1.0.0-rc.3
  - @modern-js/plugin-ssr@1.0.0-rc.3
  - @modern-js/plugin-state@1.0.0-rc.3
  - @modern-js/bff-runtime@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
  - @modern-js/runtime-core@1.0.0-rc.3
