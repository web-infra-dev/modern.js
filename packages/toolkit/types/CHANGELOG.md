# @modern-js/types

## 2.49.3

## 2.49.2

## 2.49.1

## 2.49.0

### Minor Changes

- e8c8c5d: refactor: refactor server
  refactor: 重构 server

### Patch Changes

- 6a543df: fix: ssrContext add metrics
  fix: ssrContext 添加 metrics

## 2.48.6

## 2.48.5

## 2.48.4

## 2.48.3

## 2.48.2

## 2.48.1

## 2.48.0

## 2.47.1

## 2.47.0

## 2.46.1

## 2.46.0

### Patch Changes

- 494b290: feat: Waiting for all content to load for spiders in streaming ssr
  feat: 在 streaming ssr 时，为爬虫等待所有内容加载完毕

## 2.45.0

### Patch Changes

- 19c8687: fix: add missing babel types
  fix: 添加缺失 babel 类型

## 2.44.0

### Minor Changes

- 56d7f9a: feat: SSR server support afterStreamingRender
  feat: SSR 服务端支持 afterStreamingRender

### Patch Changes

- 0ed968c: fix: SSR cache container spell
  fix: SSR 缓存相关 container 拼写修正

## 2.43.0

### Minor Changes

- d959200: feat: support ssr cache, and global storer
  feat: 支持 ssr 缓存, 以及全局存储器

## 2.42.2

### Patch Changes

- 2dfc891: types: proxy.context should allow function type

  types: proxy.context 允许传入 function

## 2.42.1

## 2.42.0

## 2.41.0

## 2.40.0

## 2.39.2

## 2.39.1

## 2.39.0

## 2.38.0

## 2.37.2

## 2.37.1

## 2.37.0

## 2.36.0

## 2.35.1

## 2.35.0

## 2.34.0

## 2.33.1

## 2.33.0

## 2.32.1

### Patch Changes

- 90e053a: feat(app-tools): add comments for configurations and functions

  feat(app-tools): 为配置和函数添加 comments 说明

## 2.32.0

### Minor Changes

- 4323e68: feat: support client-data file
  feat: 支持 client-data 文件

### Patch Changes

- 6076166: fix: packaging errors found by publint

  fix: 修复 publint 检测到的 packaging 问题

## 2.31.2

## 2.31.1

## 2.31.0

## 2.30.0

### Minor Changes

- a5ee81a: feat(server): add new server hooks `beforeServerInit` & `afterServerInit`
  feat(server): 添加新的服务端钩子 `beforeServerInit` & `afterServerInit`

### Patch Changes

- b6ab299: fix(prod-server): remove req bodyParser, let uesr parses body by themself.
  fix(prod-server): 移除 req bodyParser, 让用户自行解析 body

## 2.29.0

### Minor Changes

- cba7675: feat: add a server reporter that report server cost, logger about error, info etc.
  feat: 添加一个 server 端 reporter，来报告 server 端耗时，报错等

## 2.28.0

### Patch Changes

- 4e3ce96: fix: fix type for NestedRoute
  fix: 修复 NestedRoute 的类型

## 2.27.0

## 2.26.0

## 2.25.2

## 2.25.1

## 2.25.0

### Minor Changes

- 2491875: feat(prod-server): get body from request when ssr mode
  feat(prod-server): 开启 ssr 时从 request 获取 body

## 2.24.0

### Patch Changes

- c882fbd: feat: support config main entry name

  feat: 支持配置主入口名称

## 2.23.1

## 2.23.0

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

## 2.22.1

### Patch Changes

- 25b490a: fix: add missing type definitions
  fix: 添加遗漏的类型定义

## 2.22.0

## 2.21.1

## 2.21.0

### Patch Changes

- 1ef03dc: feat(dev-server): enable gzip compression, add devServer.compress config

  feat(dev-server): 默认启用 gzip 压缩，新增 devServer.compress 配置项

- 43b4e83: feat: support security.nonce for add nonce attribute on script tag
  feat: 支持 security.nonce 配置，为 script 标签添加 nonce 属性
- ad78387: chore(deps): bump babel-related dependencies to latest version

  chore(deps): 升级 babel 相关依赖到最新版本

## 2.20.0

### Minor Changes

- 5f055ab: feat(app-tools): route.json add `isStream` field.
  feat(app-tools): route.json 添加 `isStream` 字段.

## 2.19.1

## 2.19.0

## 2.18.1

## 2.18.0

## 2.17.1

## 2.17.0

## 2.16.0

### Patch Changes

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

## 2.15.0

## 2.14.0

### Patch Changes

- 52d0cb1: feat: support config handle of Route
  feat: 支持配置 Route 的 handle 属性

## 2.13.4

## 2.13.3

## 2.13.2

## 2.13.1

## 2.13.0

## 2.12.0

## 2.11.0

## 2.10.0

### Patch Changes

- 3e0bd50: feat: when enable bff handle render, support use `useContext` to get framework plugin context in data loader.
  feat: 当开启 BFF 托管渲染时，支持在 data loader 中使用 `useContext` 获取框架插件提供的上下文。
- 92d247f: fix: support tools.devServer.header include string[] type, remove get & delete & apply api in hook or middleware api
  fix: 支持 tools.devServer.header 包含字符串数组类型，移除 Hook 和 Middleware 中对 响应 Cookie 的获取、删除操作
- 0da32d0: chore: upgrade jest and puppeteer
  chore: 升级 jest 和 puppeteer 到 latest
- 0d9962b: fix: add types field in package.json
  fix: 添加 package.json 中的 types 字段

## 2.9.0

## 2.8.0

### Patch Changes

- 70d82e1408: fix: use mock host instead real url host for url parse, for new URL not support ipv6, and we only need parse url path & search
  fix: 使用虚拟的域名代替真实的主机名，因为 new URL 不支持解析 ipv6 的域名，并且我们只需要解析 url 的路径和查询字符串
- 1f6ca2c7fb: fix: nested routes in ssg
  fix: 修复嵌套路由在 SSG 中的问题

## 2.7.0

### Minor Changes

- dcad887024: feat: support deferred data for streaming ssr
  feat: 流式渲染支持 deferred data
- 84bfb439b8: feat: support custom apiDir, lambdaDir and style of writing for bff
  feat: 支持定制 api 目录，lambda 目录，bff 的写法

## 2.6.0

### Patch Changes

- 49fa0b1: fix: remove header info from SSR ctx to avoid security issues, reserved a switch
  fix: 移除 SSR 上下文中的 header 信息，避免造成安全问题，预留一个字段开启
- 62930b9: fix: support configure host for devServer
  fix: 支持配置 devServer 的 host

## 2.5.0

### Patch Changes

- 7cb8bb4: fix: use a more correctly params to cal document file

  fix: 使用更准确的参数去获取 docuemnt 文件

## 2.4.0

## 2.3.0

## 2.2.0

### Patch Changes

- 19bb384: fix: when a child route does not exist, an empty layout should not be created
  fix: 子路由不存在时，不应该创建空的 layout

## 2.1.0

## 2.0.2

### Patch Changes

- 39988b2: feat: advance the timing of static assets loading
  feat: 将嵌套路由下静态资源加载时机提前

## 2.0.1

## 2.0.0

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 7879e8f711: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- 2e6031955e: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 87c1ff86b9: feat(app-tools): attach builder instance to appContext

  feat(app-tools): 将 builder 实例挂载到 appContext 上

- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 7879e8f: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- 2e6031955e: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 87c1ff86b9: feat(app-tools): attach builder instance to appContext

  feat(app-tools): 将 builder 实例挂载到 appContext 上

- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 2e60319: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 40ed5874c6: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 87c1ff86b9: feat(app-tools): attach builder instance to appContext

  feat(app-tools): 将 builder 实例挂载到 appContext 上

- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 40ed587: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 87c1ff8: feat(app-tools): attach builder instance to appContext

  feat(app-tools): 将 builder 实例挂载到 appContext 上

- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Patch Changes

- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 6bda14ed71: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 40ed587: feat: inject css chunk into html for streaming ssr
  feat: streaming ssr 返回的 html 注入 css chunk
- 87c1ff8: feat(app-tools): attach builder instance to appContext

  feat(app-tools): 将 builder 实例挂载到 appContext 上

- 102d32e4ba: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 8b8e1bb571: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Patch Changes

- cc971eabf: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 6bda14ed7: feat: refactor router with react-router@6.4

  feat: 使用 react-router@6.4 重构路由模块

- 102d32e4b: feat(server): add `req` and `res` to SSR context

  feat(server): 添加 `req` 和 `res` 到 SSR context 中

- 8b8e1bb57: feat: support nested routes
  feat: 支持嵌套路由
- 3bbea92b2: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API

## 1.21.2

## 1.21.1

## 1.21.0

### Patch Changes

- f51c59a: feat: remove node internal package like fs or path which import by ssr runtime
  feat: 删除在 ssr runtime 中引用的 node 内部包

## 1.20.1

## 1.20.0

### Patch Changes

- 66e4817: feat: support devServer.historyApiFallback

  feat: 支持 devServer.historyApiFallback 配置项

## 1.19.0

## 1.18.1

### Patch Changes

- 318e149: fix: tools.devServer type missing some properties

  fix: 修复 tools.devServer 类型定义不完整的问题

- 60d95ad: fix: dev server config should be optional
  fix: devServer 配置项应该是可选配置的

## 1.18.0

## 1.17.0

## 1.16.0

### Minor Changes

- 1100dd58c: chore: support react 18

  chore: 支持 React 18

## 1.15.0

### Patch Changes

- ad05af9: fix: bff.proxy and devServer.proxy types

  fix: 修复 bff.proxy 和 devServer.proxy 类型定义不完整的问题

## 1.6.2

### Patch Changes

- c423820: fix: missing devServer.proxy.cookieDomainRewrite type

  fix: 修复 devServer.proxy.cookieDomainRewrite 类型缺失的问题

## 1.6.1

### Patch Changes

- 44e3bb1: feat: support response headers
  feat: 支持设置响应头

## 1.6.0

### Minor Changes

- 33cebd2: chore(core): move Hooks types define to `@modern-js/core`

  chore(core): 移动 Hooks 类型定义到 `@modern-js/core` 包

- 33cebd2: chore(types): delete `http-proxy-middleware` dependence(unused)

  chore(types): 删除未使用依赖 `http-proxy-middleware`

## 1.5.6

### Patch Changes

- efab847: use client init data first if exist
- Updated dependencies [5b7a5a7]
  - @modern-js/plugin@1.4.2

## 1.5.5

### Patch Changes

- 2dacc89: support set header & status in render
- Updated dependencies [f29e9ba]
  - @modern-js/plugin@1.4.0

## 1.5.4

### Patch Changes

- 192dbc78: adjust ssr types

## 1.5.3

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d5913bd96]
- Updated dependencies [d32f35134]
  - @modern-js/plugin@1.3.4

## 1.5.2

### Patch Changes

- a4c5fe78: fix test case
- 6fa74d5f: add internal metrics and logger

## 1.5.1

### Patch Changes

- 3d1fac2a: chore: app-tools no longer depend on webpack

## 1.5.0

### Minor Changes

- 3bf4f8b0: feat: support start api server only

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 60f7d8bf: feat: add tests dir to npmignore
- Updated dependencies [6cffe99d]
- Updated dependencies [60f7d8bf]
  - @modern-js/plugin@1.3.3

## 1.4.0

### Minor Changes

- d2d1d6b2: feat: support server config

## 1.3.6

### Patch Changes

- 132f7b53: feat: move config declarations to @modern-js/core

## 1.3.5

### Patch Changes

- d95f28c3: should enable babel register before server plugin require
- Updated dependencies [80d8ddfe]
- Updated dependencies [491145e3]
  - @modern-js/plugin@1.3.0

## 1.3.4

### Patch Changes

- 4499a674: feat: support to pass options to plugins
- e37ea5b2: feat: add afterMonorepoDeploy hook

## 1.3.3

### Patch Changes

- deeaa602: support svg/proxy/multi-version in unbundled

## 1.3.2

### Patch Changes

- 6891e4c2: add addDefineTypes define

## 1.3.1

### Patch Changes

- 78279953: compiler entry bug fix and dev build console
- 4d72edea: support dev compiler by entry

## 1.3.0

### Minor Changes

- ec4dbffb: feat: support as a pure api service

### Patch Changes

- 816fd721: support more server context
- bfbea9a7: support multi base url and dynamic base url
- 24f616ca: feat: support custom meta info
- 272cab15: refactor server plugin manager

## 1.2.1

### Patch Changes

- 83166714: change .npmignore
- b7c48198: feat: add beforeGenerateRoutes hook
- Updated dependencies [83166714]
  - @modern-js/plugin@1.2.1

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- e2464fe5: add more server types
- Updated dependencies [cfe11628]
  - @modern-js/plugin@1.2.0

## 1.1.5

### Patch Changes

- e51b1db3: feat: support custom sdk, interceptor, headers for bff request

## 1.1.4

### Patch Changes

- e04914ce: add route types, fix metrics types
- e04914ce: add route types, fix metrics types

## 1.1.3

### Patch Changes

- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product

## 1.1.2

### Patch Changes

- 0fa83663: support more .env files
- Updated dependencies [0fa83663]
  - @modern-js/plugin@1.1.2

## 1.1.1

### Patch Changes

- c0fc0700: feat: support deploy plugin
- Updated dependencies [6ffd1a50]
  - @modern-js/plugin@1.1.1

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/plugin@1.1.0

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
  - @modern-js/plugin@1.0.0

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
  - @modern-js/plugin@1.0.0-rc.23

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
  - @modern-js/plugin@1.0.0-rc.22

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
  - @modern-js/plugin@1.0.0-rc.21

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
  - @modern-js/plugin@1.0.0-rc.20

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
  - @modern-js/plugin@1.0.0-rc.19

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
  - @modern-js/plugin@1.0.0-rc.18

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
  - @modern-js/plugin@1.0.0-rc.17

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.16

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/plugin@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/plugin@1.0.0-rc.3
