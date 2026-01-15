# @modern-js/server-plugin

## 2.70.2

### Patch Changes

- Updated dependencies [24a3e22]
  - @modern-js/runtime-utils@2.70.2
  - @modern-js/plugin-v2@2.70.2
  - @modern-js/plugin@2.70.2
  - @modern-js/utils@2.70.2

## 2.70.1

### Patch Changes

- @modern-js/plugin-v2@2.70.1
- @modern-js/plugin@2.70.1
- @modern-js/runtime-utils@2.70.1
- @modern-js/utils@2.70.1

## 2.70.0

### Patch Changes

- @modern-js/plugin@2.70.0
- @modern-js/plugin-v2@2.70.0
- @modern-js/runtime-utils@2.70.0
- @modern-js/utils@2.70.0

## 2.69.7

### Patch Changes

- 18d5d69: fix: MPA should apply csrRender function for every single page
  fix: MPA 项目一个为每个单页面应用不同的 csrRender 逻辑
  - @modern-js/plugin-v2@2.69.7
  - @modern-js/plugin@2.69.7
  - @modern-js/runtime-utils@2.69.7
  - @modern-js/utils@2.69.7

## 2.69.6

### Patch Changes

- 36068e4: feat: add `urlPath` field to Hono context `route`, for later middleware use
  feat: 在 Hono 上下文的 `route` 中添加 `urlPath` 字段，以供后续中间件使用
- 36d8ed0: fix: escape special characters in static file routes to prevent regex syntax errors

  fix: 转义静态文件路由中的特殊字符，防止正则表达式语法错误

- e34ca06: chore: update rsc code to adapter other framework

  chore: 更新 rsc 相关代码适配更多框架

  - @modern-js/plugin-v2@2.69.6
  - @modern-js/plugin@2.69.6
  - @modern-js/runtime-utils@2.69.6
  - @modern-js/utils@2.69.6

## 2.69.5

### Patch Changes

- Updated dependencies [743bc76]
  - @modern-js/utils@2.69.5
  - @modern-js/plugin-v2@2.69.5
  - @modern-js/runtime-utils@2.69.5
  - @modern-js/plugin@2.69.5

## 2.69.4

### Patch Changes

- @modern-js/plugin-v2@2.69.4
- @modern-js/plugin@2.69.4
- @modern-js/runtime-utils@2.69.4
- @modern-js/utils@2.69.4

## 2.69.3

### Patch Changes

- Updated dependencies [0ebba1a]
  - @modern-js/utils@2.69.3
  - @modern-js/plugin@2.69.3
  - @modern-js/plugin-v2@2.69.3
  - @modern-js/runtime-utils@2.69.3

## 2.69.2

### Patch Changes

- 80358b4: fix: should read html templates only in getHtmlTemplates function
  fix: 在 getHtmlTemplates 函数中读取 html 模板
- 0ce9b91: perf: server monitor add more tags for timing/counter event
  perf: server monitor 为 timing/couter 事件添加更多的 tags
  - @modern-js/plugin-v2@2.69.2
  - @modern-js/runtime-utils@2.69.2
  - @modern-js/utils@2.69.2
  - @modern-js/plugin@2.69.2

## 2.69.1

### Patch Changes

- @modern-js/plugin@2.69.1
- @modern-js/plugin-v2@2.69.1
- @modern-js/runtime-utils@2.69.1
- @modern-js/utils@2.69.1

## 2.69.0

### Patch Changes

- @modern-js/plugin-v2@2.69.0
- @modern-js/plugin@2.69.0
- @modern-js/runtime-utils@2.69.0
- @modern-js/utils@2.69.0

## 2.68.20

### Patch Changes

- 914c32e: fix: Avoid caching unexpected responses
  fix: 避免不受期待的响应被缓存
  - @modern-js/plugin@2.68.20
  - @modern-js/plugin-v2@2.68.20
  - @modern-js/runtime-utils@2.68.20
  - @modern-js/utils@2.68.20

## 2.68.19

### Patch Changes

- 7edc183: fix: server hooks not get when run onPrepare

  fix: 修复服务端插件在 onPrepare 中获取 hooks 失败

  - @modern-js/plugin@2.68.19
  - @modern-js/plugin-v2@2.68.19
  - @modern-js/runtime-utils@2.68.19
  - @modern-js/utils@2.68.19

## 2.68.18

### Patch Changes

- 2294b02: fix: compatibility afterStreamingRender return string type
  fix: 兼容 afterStreamingRender 返回 string 类型
- Updated dependencies [8157051]
  - @modern-js/utils@2.68.18
  - @modern-js/plugin@2.68.18
  - @modern-js/plugin-v2@2.68.18
  - @modern-js/runtime-utils@2.68.18

## 2.68.17

### Patch Changes

- 3a773b1: fix: add exports fro helper module in server-core package.json
  fix: 为 server-core package.json 添加 helper 模块的 sub-exports
- Updated dependencies [aac9de0]
  - @modern-js/utils@2.68.17
  - @modern-js/plugin-v2@2.68.17
  - @modern-js/plugin@2.68.17
  - @modern-js/runtime-utils@2.68.17

## 2.68.16

### Patch Changes

- @modern-js/plugin@2.68.16
- @modern-js/plugin-v2@2.68.16
- @modern-js/runtime-utils@2.68.16
- @modern-js/utils@2.68.16

## 2.68.15

### Patch Changes

- @modern-js/plugin@2.68.15
- @modern-js/plugin-v2@2.68.15
- @modern-js/runtime-utils@2.68.15
- @modern-js/utils@2.68.15

## 2.68.14

### Patch Changes

- @modern-js/plugin@2.68.14
- @modern-js/plugin-v2@2.68.14
- @modern-js/runtime-utils@2.68.14
- @modern-js/utils@2.68.14

## 2.68.13

### Patch Changes

- e24d1f7: feat: server config support onError
  feat: 自定义 server 支持错误处理
  - @modern-js/plugin@2.68.13
  - @modern-js/plugin-v2@2.68.13
  - @modern-js/runtime-utils@2.68.13
  - @modern-js/utils@2.68.13

## 2.68.12

### Patch Changes

- @modern-js/plugin@2.68.12
- @modern-js/plugin-v2@2.68.12
- @modern-js/runtime-utils@2.68.12
- @modern-js/utils@2.68.12

## 2.68.11

### Patch Changes

- @modern-js/plugin@2.68.11
- @modern-js/plugin-v2@2.68.11
- @modern-js/runtime-utils@2.68.11
- @modern-js/utils@2.68.11

## 2.68.10

### Patch Changes

- 8da2e1a: fix: process should not exit caused when user abort the request in development
  fix: 开发阶段，进程不应该因为用户中止请求而退出
- Updated dependencies [8da2e1a]
  - @modern-js/runtime-utils@2.68.10
  - @modern-js/plugin-v2@2.68.10
  - @modern-js/plugin@2.68.10
  - @modern-js/utils@2.68.10

## 2.68.9

### Patch Changes

- @modern-js/plugin@2.68.9
- @modern-js/plugin-v2@2.68.9
- @modern-js/runtime-utils@2.68.9
- @modern-js/utils@2.68.9

## 2.68.8

### Patch Changes

- @modern-js/plugin@2.68.8
- @modern-js/plugin-v2@2.68.8
- @modern-js/runtime-utils@2.68.8
- @modern-js/utils@2.68.8

## 2.68.7

### Patch Changes

- 4ece2d4: fix: remove ssr.scriptLoading
  fix: 移除 ssr.scriptLoading
- 4ece2d4: feat: support forceCSR at the entry level
  feat: 支持 forceCSR 在 entry 级别
- 8b13982: fix: proxy request
  fix: 修复 proxy request 问题
  - @modern-js/plugin@2.68.7
  - @modern-js/plugin-v2@2.68.7
  - @modern-js/runtime-utils@2.68.7
  - @modern-js/utils@2.68.7

## 2.68.6

### Patch Changes

- ee61047: feat: support enableHandleWeb for csr + rsc projects
  feat: 为 CSR 和 RSC 项目支持 enableHandleWeb
- ffaab92: feat: hono bff req support node 24
  feat: hono bff req 支持 node 24
  - @modern-js/plugin@2.68.6
  - @modern-js/plugin-v2@2.68.6
  - @modern-js/runtime-utils@2.68.6
  - @modern-js/utils@2.68.6

## 2.68.5

### Patch Changes

- @modern-js/plugin-v2@2.68.5
- @modern-js/plugin@2.68.5
- @modern-js/runtime-utils@2.68.5
- @modern-js/utils@2.68.5

## 2.68.4

### Patch Changes

- @modern-js/plugin@2.68.4
- @modern-js/plugin-v2@2.68.4
- @modern-js/runtime-utils@2.68.4
- @modern-js/utils@2.68.4

## 2.68.3

### Patch Changes

- 0749a8b: chore: remove node polyfills
  chore: 移除 node polyfills
  - @modern-js/plugin@2.68.3
  - @modern-js/plugin-v2@2.68.3
  - @modern-js/runtime-utils@2.68.3
  - @modern-js/utils@2.68.3

## 2.68.2

### Patch Changes

- Updated dependencies [6562f76]
- Updated dependencies [477f567]
  - @modern-js/runtime-utils@2.68.2
  - @modern-js/plugin-v2@2.68.2
  - @modern-js/plugin@2.68.2
  - @modern-js/utils@2.68.2

## 2.68.1

### Patch Changes

- 0d98723: feat: support rsc for spa projects
  feat: 为 SPA 项目支持 RSC
- 0d98723: feat: inject the rsc payload into the html for csr
  feat: 为 CSR 项目，注入 rsc payload 到 html 中
  - @modern-js/plugin-v2@2.68.1
  - @modern-js/plugin@2.68.1
  - @modern-js/runtime-utils@2.68.1
  - @modern-js/utils@2.68.1

## 2.68.0

### Patch Changes

- @modern-js/plugin@2.68.0
- @modern-js/plugin-v2@2.68.0
- @modern-js/runtime-utils@2.68.0
- @modern-js/utils@2.68.0

## 2.67.11

### Patch Changes

- @modern-js/plugin@2.67.11
- @modern-js/plugin-v2@2.67.11
- @modern-js/runtime-utils@2.67.11
- @modern-js/utils@2.67.11

## 2.67.10

### Patch Changes

- @modern-js/plugin@2.67.10
- @modern-js/plugin-v2@2.67.10
- @modern-js/runtime-utils@2.67.10
- @modern-js/utils@2.67.10

## 2.67.9

### Patch Changes

- Updated dependencies [474aa1e]
  - @modern-js/plugin-v2@2.67.9
  - @modern-js/plugin@2.67.9
  - @modern-js/runtime-utils@2.67.9
  - @modern-js/utils@2.67.9

## 2.67.8

### Patch Changes

- Updated dependencies [23c8201]
  - @modern-js/utils@2.67.8
  - @modern-js/plugin-v2@2.67.8
  - @modern-js/plugin@2.67.8
  - @modern-js/runtime-utils@2.67.8

## 2.67.7

### Patch Changes

- @modern-js/plugin@2.67.7
- @modern-js/plugin-v2@2.67.7
- @modern-js/runtime-utils@2.67.7
- @modern-js/utils@2.67.7

## 2.67.6

### Patch Changes

- 67a21da: fix(server): static middleware should ignore domain when detect whether the request is for static asset
  fix(server): 资源中间件在检测请求是否为静态资源时，应该忽略 assetPrefix 中的域名
- e67b6d0: feat: add middlewares and renderMiddlewares to server plugin context
  feat: 添加 middlewares 和 renderMiddlewares 到服务端插件上下文中
- Updated dependencies [e67b6d0]
- Updated dependencies [a3e140d]
  - @modern-js/plugin-v2@2.67.6
  - @modern-js/runtime-utils@2.67.6
  - @modern-js/utils@2.67.6
  - @modern-js/plugin@2.67.6

## 2.67.5

### Patch Changes

- @modern-js/plugin@2.67.5
- @modern-js/plugin-v2@2.67.5
- @modern-js/runtime-utils@2.67.5
- @modern-js/utils@2.67.5

## 2.67.4

### Patch Changes

- 35e9786: feat: modern.server supports extended server
  feat: modern.server 支持扩展 modern.js 服务
- 2b65e0c: fix(server): should sync all headers from req.headers
  fix(server): 应该从 req.headers 同步所有的 headers
- Updated dependencies [35e9786]
- Updated dependencies [3a66335]
- Updated dependencies [03cf233]
- Updated dependencies [446939a]
- Updated dependencies [446939a]
- Updated dependencies [b00922e]
- Updated dependencies [446939a]
  - @modern-js/plugin-v2@2.67.4
  - @modern-js/runtime-utils@2.67.4
  - @modern-js/plugin@2.67.4
  - @modern-js/utils@2.67.4

## 2.67.3

### Patch Changes

- f6b81dd: feat: bff supports hono runtime framework
  feat: bff 支持 hono 运行时框架
- f6b81dd: refactor: avoid only one of "req" and "request" has a request body
  refactor: 避免 req 和 request 只有一个有请求体
  - @modern-js/plugin-v2@2.67.3
  - @modern-js/runtime-utils@2.67.3
  - @modern-js/utils@2.67.3
  - @modern-js/plugin@2.67.3

## 2.67.2

### Patch Changes

- b310249: feat(ssr): support customizing fallback reason via `x-modern-ssr-fallback` header
  feat(ssr): 支持在 `x-modern-ssr-fallback` 中自定义降级原因
- 23a111f: feat: improve modern.js server performance
  feat: 提升 modern.js 服务器性能
- c964f07: feat(ssr): inject fallback reason to html
  feat(ssr): 注入降级原因到响应的 html
- Updated dependencies [8f97aae]
  - @modern-js/runtime-utils@2.67.2
  - @modern-js/plugin-v2@2.67.2
  - @modern-js/plugin@2.67.2
  - @modern-js/utils@2.67.2

## 2.67.1

### Patch Changes

- 1d96265: feat(ssr): support streaming ssr to work with http2
  feat(ssr): 支持 streaming ssr 和 http2 协议一起工作
- Updated dependencies [1d96265]
  - @modern-js/utils@2.67.1
  - @modern-js/plugin-v2@2.67.1
  - @modern-js/runtime-utils@2.67.1
  - @modern-js/plugin@2.67.1

## 2.67.0

### Patch Changes

- 7503f22: fix: should detect page route by entryName, not isApi
  fix: 应该通过 entryName 来判断是否是页面路由，而不是 isApi
  - @modern-js/plugin@2.67.0
  - @modern-js/plugin-v2@2.67.0
  - @modern-js/runtime-utils@2.67.0
  - @modern-js/utils@2.67.0

## 2.66.0

### Patch Changes

- e48a5ae: feat: rename ServerPlugin to ServerPluginLegacy and ServerPluginFuture to ServerPlugin

  feat: 将 ServerPlugin 类型重命名为 ServerPluginLegacy，ServerPluginFuture 类型重命名为 ServerPlugin

- Updated dependencies [e48a5ae]
  - @modern-js/plugin-v2@2.66.0
  - @modern-js/plugin@2.66.0
  - @modern-js/runtime-utils@2.66.0
  - @modern-js/utils@2.66.0

## 2.65.5

### Patch Changes

- fb6bf9e: fix: add new mid connet for mock handler
- Updated dependencies [90a3c1c]
- Updated dependencies [58a1afd]
  - @modern-js/runtime-utils@2.65.5
  - @modern-js/plugin@2.65.5
  - @modern-js/utils@2.65.5

## 2.65.4

### Patch Changes

- f1cd095: feat: Modern.js server static middleware should always use system fs
  feat: Modern.js 的静态中间件应该始终使用系统 fs
- Updated dependencies [0d47cb8]
- Updated dependencies [f1cd095]
  - @modern-js/utils@2.65.4
  - @modern-js/runtime-utils@2.65.4
  - @modern-js/plugin@2.65.4

## 2.65.3

### Patch Changes

- Updated dependencies [087ae7c]
  - @modern-js/runtime-utils@2.65.3
  - @modern-js/utils@2.65.3
  - @modern-js/plugin@2.65.3

## 2.65.2

### Patch Changes

- 793be44: feat: support get monitors in Data Loader and Component
  feat: 在 Data Loader 和组件中支持获取 monitors
- 1fe923c: chore: use monitors instead of reporter to report Data Loader cost
  chore: 使用 monitors 代替 reporter 来上报 Data Loader 耗时
- f3fc1db: chore: remove `reporter.init` and use Monitors to report request cost
  chore: 移除 `reporter.init` 并且使用 Monitors 上报请求耗时
- Updated dependencies [793be44]
- Updated dependencies [1fe923c]
- Updated dependencies [8837b85]
- Updated dependencies [1f83d96]
  - @modern-js/runtime-utils@2.65.2
  - @modern-js/utils@2.65.2
  - @modern-js/plugin@2.65.2

## 2.65.1

### Patch Changes

- @modern-js/plugin@2.65.1
- @modern-js/runtime-utils@2.65.1
- @modern-js/utils@2.65.1

## 2.65.0

### Patch Changes

- 4c0aca6: feat: pass through the body, when query is pass_body
  feat: 透传 body，当 query 为 pass_body 时
  - @modern-js/plugin@2.65.0
  - @modern-js/runtime-utils@2.65.0
  - @modern-js/utils@2.65.0

## 2.64.3

### Patch Changes

- d77a6df: feat(server): allow x-parse-through-body header to parse through the body of req
  feat(server): 添加 x-parse-through-body 以透传请求体
  - @modern-js/plugin@2.64.3
  - @modern-js/runtime-utils@2.64.3
  - @modern-js/utils@2.64.3

## 2.64.2

### Patch Changes

- 4ae943d: fix: add `server.logger` to control internal server logger
  fix: 添加 `server.logger` 配置来控制 Server 内部日志
- 02ca983: feat: unify server monitors usage, add error logger for data loader
  feat: 统一 server 监控的使用方式，为 data loader 添加错误日志
  - @modern-js/runtime-utils@2.64.2
  - @modern-js/utils@2.64.2
  - @modern-js/plugin@2.64.2

## 2.64.1

### Patch Changes

- @modern-js/plugin@2.64.1
- @modern-js/runtime-utils@2.64.1
- @modern-js/utils@2.64.1

## 2.64.0

### Patch Changes

- @modern-js/plugin@2.64.0
- @modern-js/runtime-utils@2.64.0
- @modern-js/utils@2.64.0

## 2.63.7

### Patch Changes

- @modern-js/plugin@2.63.7
- @modern-js/runtime-utils@2.63.7
- @modern-js/utils@2.63.7

## 2.63.6

### Patch Changes

- a7a4573: fix: use entryName to ensure match the target route correctly after router.rewrite
  fix: 通过 entryName 确保 router.rewrite 后能匹配到正确的路由
  - @modern-js/plugin@2.63.6
  - @modern-js/runtime-utils@2.63.6
  - @modern-js/utils@2.63.6

## 2.63.5

### Patch Changes

- @modern-js/plugin@2.63.5
- @modern-js/runtime-utils@2.63.5
- @modern-js/utils@2.63.5

## 2.63.4

### Patch Changes

- 95b026d: fix: cache should not be overrides when request has tail slash
  fix: 当请求有尾斜杠时，缓存不应该被重写
  - @modern-js/plugin@2.63.4
  - @modern-js/runtime-utils@2.63.4
  - @modern-js/utils@2.63.4

## 2.63.3

### Patch Changes

- 5c97ec2: chore: `getServerManifest` should run first on `prepare`
  chore: `getServerManifest` 应该在 `prepare` 时运行
- e5b16df: chore: should load html template while server preparing
  chore: 在 server 准备时应该加载 html 模板
  - @modern-js/plugin@2.63.3
  - @modern-js/runtime-utils@2.63.3
  - @modern-js/utils@2.63.3

## 2.63.2

### Patch Changes

- 524d6af: feat: add server.useJsonScript , for instead ssr.inlineScript
  feat: 添加 server.useJsonScript 配置，代替 ssr.inlineScript
- 3d2bf55: feat: add route info into unstable_middleware context
  feat: 添加路由信息到 unstable_middleware 上下文中
- bc1670a: fix: should get server routes from route.json in serve command
  fix: 在 serve 命令下应该从 route.json 中获取 server routes
- 30f89d5: fix: unstable_middlwares doesn't exec when render.middlewares not empty
  fix: 修复 unstable_middlwares 在 `render.middlewares` 不为空时不执行的问题
- Updated dependencies [5fc95f7]
- Updated dependencies [53e3ae0]
  - @modern-js/utils@2.63.2
  - @modern-js/plugin@2.63.2
  - @modern-js/runtime-utils@2.63.2

## 2.63.1

### Patch Changes

- @modern-js/plugin@2.63.1
- @modern-js/runtime-utils@2.63.1
- @modern-js/utils@2.63.1

## 2.63.0

### Patch Changes

- @modern-js/plugin@2.63.0
- @modern-js/runtime-utils@2.63.0
- @modern-js/utils@2.63.0

## 2.62.1

### Patch Changes

- Updated dependencies [86213ae]
  - @modern-js/runtime-utils@2.62.1
  - @modern-js/plugin@2.62.1
  - @modern-js/utils@2.62.1

## 2.62.0

### Patch Changes

- @modern-js/plugin@2.62.0
- @modern-js/runtime-utils@2.62.0
- @modern-js/utils@2.62.0

## 2.61.0

### Patch Changes

- 45230e2: fix: hot reload problems for server
  fix: 修复服务端热更新问题
- a7ff13f: feat: passthrough body, when receiving an mf request
  feat: 当收到一个 mf 请求时，透传 body
- Updated dependencies [45230e2]
  - @modern-js/utils@2.61.0
  - @modern-js/plugin@2.61.0
  - @modern-js/runtime-utils@2.61.0

## 2.60.6

### Patch Changes

- e6daf22: fix(server): handle the cases that res cannot be writable
  fix(server): 处理 res 无法写入的情况
- Updated dependencies [c4894e6]
  - @modern-js/runtime-utils@2.60.6
  - @modern-js/plugin@2.60.6
  - @modern-js/utils@2.60.6

## 2.60.5

### Patch Changes

- @modern-js/plugin@2.60.5
- @modern-js/runtime-utils@2.60.5
- @modern-js/utils@2.60.5

## 2.60.4

### Patch Changes

- 518b783: feat(server): add catch logic for ssrCache container operation
  feat(server): 为 ssr 缓存容器操作添加错误捕获逻辑
- a9e3eb7: fix(server): should get context from unstable middleware correctly
  fix(server): 应该正确地获取到 loaderContext
- Updated dependencies [c87813e]
  - @modern-js/runtime-utils@2.60.4
  - @modern-js/plugin@2.60.4
  - @modern-js/utils@2.60.4

## 2.60.3

### Patch Changes

- Updated dependencies [303331c]
  - @modern-js/utils@2.60.3
  - @modern-js/plugin@2.60.3
  - @modern-js/runtime-utils@2.60.3

## 2.60.2

### Patch Changes

- 0a31d31: feat: support <NoSSRCache> Component, only use ssr.mode='string'

  feat: 支持 <NoSSRCache> 组件, 仅在 ssr.mode 为 'string'的时候生效

- Updated dependencies [8a709bc]
  - @modern-js/utils@2.60.2
  - @modern-js/plugin@2.60.2
  - @modern-js/runtime-utils@2.60.2

## 2.60.1

### Patch Changes

- @modern-js/plugin@2.60.1
- @modern-js/runtime-utils@2.60.1
- @modern-js/utils@2.60.1

## 2.60.0

### Patch Changes

- d6e0118: fix: we should not cache the html, if we can match the html is downgrading.
  fix: 在 ssr 降级时，我们不应该缓存 html
  - @modern-js/plugin@2.60.0
  - @modern-js/runtime-utils@2.60.0
  - @modern-js/utils@2.60.0

## 2.59.0

### Patch Changes

- 539d72b: fix: typo and type for internalDirectory in server appContext
  fix: 修复 internalDirectory 在 server appContext 中的类型错误
- ef1ec44: fix: we should run runner.fallback when ssr fallback
  fix: 我们应该在 ssr 降级时运行 runn.fallback
- 80237dc: fix: server-core should not be import node api
  fix: server-core 不应该被引入 node api
  - @modern-js/runtime-utils@2.59.0
  - @modern-js/utils@2.59.0
  - @modern-js/plugin@2.59.0

## 2.58.3

### Patch Changes

- 36ccad3: fix: custom server hook context request.path should carray query str
  fix: custom server hook context request.path 应该带上 query 字符串
- 0b581a4: fix: remove ssr.preload config
  fix: 移除 ssr.preload 配置
- 610554c: chore: add internal directory to server plugin context
  chore: 在 server 插件上下文中增加 internal 目录
- 59fba90: fix(data-loader): compatible with asyncEntry for data loader
  fix(data-loader): data loader 的导出兼容 asyncEntry
- 9e82b00: fix(server): if res was piped, res should be treated as sent
  fix(server): 如果响应被 pipe，响应应该被当作已经发送
  - @modern-js/plugin@2.58.3
  - @modern-js/runtime-utils@2.58.3
  - @modern-js/utils@2.58.3

## 2.58.2

### Patch Changes

- 1ff0304: fix: custom server route rewrite should carry honoContext.env
  fix: custom server 路由重写应该带上 honoContext.env
- Updated dependencies [7715b6d]
- Updated dependencies [44c1bc4]
- Updated dependencies [a1a9373]
  - @modern-js/runtime-utils@2.58.2
  - @modern-js/utils@2.58.2
  - @modern-js/plugin@2.58.2

## 2.58.1

### Patch Changes

- c904ee2: fix: ssrContext get protocal from x-forwarded-proto first, then new server middleware support rewrite request
  fix: ssrContext 优先从 x-forwarded-proto 取协议, 另外新 server middleware 支持重写 request
- a214ea8: fix: use flatted instead of safeReplacer
  fix: 使用 flated 而不是使用 safeReplacer
  - @modern-js/runtime-utils@2.58.1
  - @modern-js/utils@2.58.1
  - @modern-js/plugin@2.58.1

## 2.58.0

### Patch Changes

- @modern-js/plugin@2.58.0
- @modern-js/runtime-utils@2.58.0
- @modern-js/utils@2.58.0

## 2.57.1

### Patch Changes

- bc565cd: fix: should use dynamic import to import matchRoutes
  fix: 应该使用 动态 import 来引入 matchRoutes
  - @modern-js/plugin@2.57.1
  - @modern-js/runtime-utils@2.57.1
  - @modern-js/utils@2.57.1

## 2.57.0

### Patch Changes

- 2515b00: feat(ssr): support server.ssrByRouteIds
  feat(ssr): 支持 server.ssrByRouteIds
- 0e906a1: feat: inject renderHandler to appContext & add default serverPlugins
  feat: 注入 renderHandler 到 appContext & 新增默认 serverPlugins
- 6cec127: fix: user can get status in afterRenderContext
  fix: 用户可以从 afterRenderContext 上拿到 status
- b5a48a8: fix: distPath should from output.distPath.root
  fix: distPath 应该来自 output.distPath.root
- 203c9eb: fix: we should export `getLoaderCtx` from server-core
  fix: 我们应该从 server-core 导出 `getLoaderCtx`
- 604ad3a: fix: faviconPlugin should after staticPlugin
  fix: faviconPlugin 应该在 staticPlugin 之后
- Updated dependencies [2515b00]
- Updated dependencies [916559a]
- Updated dependencies [dc736ef]
  - @modern-js/utils@2.57.0
  - @modern-js/runtime-utils@2.57.0
  - @modern-js/plugin@2.57.0

## 2.56.2

### Patch Changes

- @modern-js/plugin@2.56.2
- @modern-js/runtime-utils@2.56.2
- @modern-js/utils@2.56.2

## 2.56.1

### Patch Changes

- e0e29b3: fix: new server middleware support get body, if request.method is post
  fix: 如果请求是 post, 新 server middlewares 可以拿到 body 数据
  - @modern-js/plugin@2.56.1
  - @modern-js/runtime-utils@2.56.1
  - @modern-js/utils@2.56.1

## 2.56.0

### Minor Changes

- bedbbb3: feat: server monitors interface unity
  feat: server 监控接口统一

### Patch Changes

- 9eee52a: fix: server runtime should get config.disablePrerender from ssr config
  fix: server runtime 应该从 ssrconfig 获取 config.disablePrerender
  - @modern-js/runtime-utils@2.56.0
  - @modern-js/utils@2.56.0
  - @modern-js/plugin@2.56.0

## 2.55.0

### Patch Changes

- e0c2384: fix: cacheProvider support return false
  fix: cacheProvider 支持返回 false
- Updated dependencies [bbcf55a]
  - @modern-js/utils@2.55.0
  - @modern-js/plugin@2.55.0
  - @modern-js/runtime-utils@2.55.0

## 2.54.6

### Patch Changes

- @modern-js/plugin@2.54.6
- @modern-js/runtime-utils@2.54.6
- @modern-js/utils@2.54.6

## 2.54.5

### Patch Changes

- 5525a23: fix: logger maybe undefined when server occur error
  fix: logger 可能是 undefined 当 server 发生错误时
  - @modern-js/plugin@2.54.5
  - @modern-js/runtime-utils@2.54.5
  - @modern-js/utils@2.54.5

## 2.54.4

### Patch Changes

- @modern-js/plugin@2.54.4
- @modern-js/runtime-utils@2.54.4
- @modern-js/utils@2.54.4

## 2.54.3

### Patch Changes

- b50d7ec: fix: we should load modern.config.json when production
  fix: 在生产阶段，我们应该加载 modern.config.json
  - @modern-js/plugin@2.54.3
  - @modern-js/runtime-utils@2.54.3
  - @modern-js/utils@2.54.3

## 2.54.2

### Patch Changes

- @modern-js/plugin@2.54.2
- @modern-js/runtime-utils@2.54.2
- @modern-js/utils@2.54.2

## 2.54.1

### Patch Changes

- 29aeb3c: fix: downgrading deepmerge-ts, deepmerge-ts v7 can't run in nodev16.2.0
  fix: 降级 deepmerge-ts, deepmerge-ts v7 在 nodev16.2.0 上跑
  - @modern-js/plugin@2.54.1
  - @modern-js/runtime-utils@2.54.1
  - @modern-js/utils@2.54.1

## 2.54.0

### Minor Changes

- a8d8f0c: feat: support new server plugin & discard server plugin some hooks
  feat: 支持新 server plugin & 减少 server plugin 钩子

### Patch Changes

- 8cdb67d: fix: render function dynamic router match error
  fix: render 函数动态路由匹配错误
- 09798ac: feat: refactor runtime plugin

  feat: 重构 runtime 插件

- Updated dependencies [15a090c]
- Updated dependencies [a8d8f0c]
- Updated dependencies [09798ac]
  - @modern-js/utils@2.54.0
  - @modern-js/plugin@2.54.0
  - @modern-js/runtime-utils@2.54.0

## 2.53.0

### Patch Changes

- 0fce81a: fix: avoid to mismatch header label
  fix: 避免误匹配 header 标签
- b251046: fix: Avoid memory leaks in node versions 18 and 20
  fix: 避免在 node 18 和 20 版本下内存泄露
- a481488: fix: should add the escape character for the regexps
  fix: 为正则表达式添加转义字符
  - @modern-js/plugin@2.53.0
  - @modern-js/runtime-utils@2.53.0
  - @modern-js/utils@2.53.0

## 2.52.0

### Patch Changes

- ad4548d: fix: redablestream should not be locked, when stream transfer
  fix: redablestream 不应该被锁住当 stream 传输时
- 920d856: fix: export writeReadableStreamToWritable
  fix: 暴露 writeReadableStreamToWritable 方法
- Updated dependencies [85ac453]
  - @modern-js/runtime-utils@2.52.0
  - @modern-js/plugin@2.52.0
  - @modern-js/utils@2.52.0

## 2.51.0

### Minor Changes

- 9d4d04d: feat: support deploy command
  feat: 支持部署命令

### Patch Changes

- @modern-js/plugin@2.51.0
- @modern-js/runtime-utils@2.51.0
- @modern-js/utils@2.51.0

## 2.50.0

### Patch Changes

- 7ed2fbc: chore: add bodyInit for createWebRequest
  chore: createWebRequest 函数支持 bodyInit 入参
  - @modern-js/plugin@2.50.0
  - @modern-js/runtime-utils@2.50.0
  - @modern-js/utils@2.50.0

## 2.49.4

### Patch Changes

- 4653e73: fix(server-core): server static can't handle page route correctly
  fix(server-core): server static 无法正确的处理页面路由
- 2c60b6b: fix(server-core): support custom server middleware redirect, and support render function merge headers from HonoCtx.#header
  fix(server-core): 支持 custom server middleware 重定向, 并且支持 render 函数合并 HonoCtx.#header
- 936ca64: fix: Compatible with http-compression, make sure res.end is called before executing the subsequent code
  fix: 兼容 http-compression，确保执行后续代码前，res.end 先被调用
- 6e12e9f: fix: public middleware should not filter api route & support https
  fix: public middleware 不应该过滤 api 路由 & 支持 https
  - @modern-js/plugin@2.49.4
  - @modern-js/runtime-utils@2.49.4
  - @modern-js/utils@2.49.4

## 2.49.3

### Patch Changes

- d936fe3: fix: serverBase may be undefined when get renderHandler
  fix: 当获得 renderHandler 时, serverBase 有可能是 undefined
- 45cae97: fix: render should handle api route when open enableHandleWeb
  fix: 当开启了 enableHandleWeb, render 应该处理 api 路由
- 0c4929f: fix: add onFallback for renderHandler
  fix: 给 renderHandler 增加 onFallback 回调
- 1b594a5: fix: we should not log error when bundle is not exists
  fix: 我们不应该打印错误日志，当 bundle 不存在时
- 4d728d2: fix: server middleware response lose some methods
  fix: server middleware response 丢失一些方法
- aa3a1dc: fix: log error when load bundle failed
  fix: 打印错误日志当 bundle 加载错误时
- 327f607: fix: server support add extends res headers from routes
  fix: server 支持丛 route.json 添加额外的响应头
- 3e663e9: feat(server-core): render support dynamic route
  feat(server-core): render 支持动态路由
  - @modern-js/plugin@2.49.3
  - @modern-js/runtime-utils@2.49.3
  - @modern-js/utils@2.49.3

## 2.49.2

### Patch Changes

- @modern-js/plugin@2.49.2
- @modern-js/runtime-utils@2.49.2
- @modern-js/utils@2.49.2

## 2.49.1

### Patch Changes

- 0c395bc: fix: swc can not transform dynamic import in cjs normally
- 58c3729: fix: require bundle maybe failed
  fix: require bundle 有可能是失败的
- 5b44c1c: chore: export getServerManifest
  chore: 导出 getServerManifest 方法
  - @modern-js/plugin@2.49.1
  - @modern-js/runtime-utils@2.49.1
  - @modern-js/utils@2.49.1

## 2.49.0

### Minor Changes

- e8c8c5d: refactor: refactor server
  refactor: 重构 server

### Patch Changes

- fa7949a: fix: adjust rslog level so that user can print log in middleware
  fix: 调整 rslog 等级保证用户能够在中间件等地方打印日志
- d7c883b: fix: server hook need save the res status and headers
  fix: server hook 需要保留 res 的 status 和 headers
- 768d2e0: fix: streaming ssr should add transfer-enconding: chunked
  fix: streaming ssr 应该添加头 transfer-enconding: chunked
- 6a543df: fix: ssrContext add metrics
  fix: ssrContext 添加 metrics
- f6c632f: fix: server middleware ctx status should be set when return response
  fix: server 中间件的 ctx.status 应该被设置当返回 response 时
- 259a175: fix(server-core): new server should return 404 when can't found html template & 404,500 response shouldn't run afterRenderHook
  fix(server-core): 新 server 在找不到 html 模版时应该返回 404, 且 404，500 响应不应该被 afterRenderHook 处理
- Updated dependencies [e8c8c5d]
  - @modern-js/runtime-utils@2.49.0
  - @modern-js/utils@2.49.0
  - @modern-js/plugin@2.49.0

## 2.48.6

### Patch Changes

- @modern-js/plugin@2.48.6
- @modern-js/utils@2.48.6

## 2.48.5

### Patch Changes

- Updated dependencies [4ca9f4c]
  - @modern-js/utils@2.48.5
  - @modern-js/plugin@2.48.5

## 2.48.4

### Patch Changes

- Updated dependencies [7d2d433]
  - @modern-js/utils@2.48.4
  - @modern-js/plugin@2.48.4

## 2.48.3

### Patch Changes

- @modern-js/plugin@2.48.3
- @modern-js/utils@2.48.3

## 2.48.2

### Patch Changes

- @modern-js/plugin@2.48.2
- @modern-js/utils@2.48.2

## 2.48.1

### Patch Changes

- Updated dependencies [8942b90]
- Updated dependencies [ce426f7]
  - @modern-js/utils@2.48.1
  - @modern-js/plugin@2.48.1

## 2.48.0

### Patch Changes

- Updated dependencies [c323a23]
  - @modern-js/utils@2.48.0
  - @modern-js/plugin@2.48.0

## 2.47.1

### Patch Changes

- @modern-js/plugin@2.47.1
- @modern-js/utils@2.47.1

## 2.47.0

### Minor Changes

- b68c12a: feat: add server SSR fallback hook
  feat: 新增 server SSR 降级 hook 实现

### Patch Changes

- Updated dependencies [a5386ab]
  - @modern-js/utils@2.47.0
  - @modern-js/plugin@2.47.0

## 2.46.1

### Patch Changes

- @modern-js/plugin@2.46.1
- @modern-js/utils@2.46.1

## 2.46.0

### Patch Changes

- @modern-js/utils@2.46.0
- @modern-js/plugin@2.46.0

## 2.45.0

### Patch Changes

- f50ad3e: fix: adjust logger code
  fix: 调整 logger 冗余代码
  - @modern-js/utils@2.45.0
  - @modern-js/plugin@2.45.0

## 2.44.0

### Minor Changes

- 56d7f9a: feat: SSR server support afterStreamingRender
  feat: SSR 服务端支持 afterStreamingRender

### Patch Changes

- @modern-js/utils@2.44.0
- @modern-js/plugin@2.44.0

## 2.43.0

### Patch Changes

- ae22b74: feat: support ssr pass more context
  feat: 支持传递更多的 ssr context
- 5782aa3: chore(server): remove useless server plugin hooks (beforeDevServer & afterDevServer)

  chore(server): 移除无用的 server 插件钩子 (beforeDevServer 和 afterDevServer)

  - @modern-js/utils@2.43.0
  - @modern-js/plugin@2.43.0

## 2.42.2

### Patch Changes

- @modern-js/utils@2.42.2
- @modern-js/plugin@2.42.2

## 2.42.1

### Patch Changes

- @modern-js/plugin@2.42.1
- @modern-js/utils@2.42.1

## 2.42.0

### Patch Changes

- @modern-js/plugin@2.42.0
- @modern-js/utils@2.42.0

## 2.41.0

### Patch Changes

- c4d396a: chore(swc): bump swc and helpers
  chore(swc): 升级 swc 以及 helpers
- Updated dependencies [c4d396a]
  - @modern-js/plugin@2.41.0
  - @modern-js/utils@2.41.0

## 2.40.0

### Patch Changes

- Updated dependencies [95f15d2]
  - @modern-js/utils@2.40.0
  - @modern-js/plugin@2.40.0

## 2.39.2

### Patch Changes

- @modern-js/plugin@2.39.2
- @modern-js/utils@2.39.2

## 2.39.1

### Patch Changes

- @modern-js/plugin@2.39.1
- @modern-js/utils@2.39.1

## 2.39.0

### Patch Changes

- @modern-js/plugin@2.39.0
- @modern-js/utils@2.39.0

## 2.38.0

### Patch Changes

- @modern-js/plugin@2.38.0
- @modern-js/utils@2.38.0

## 2.37.2

### Patch Changes

- @modern-js/plugin@2.37.2
- @modern-js/utils@2.37.2

## 2.37.1

### Patch Changes

- @modern-js/plugin@2.37.1
- @modern-js/utils@2.37.1

## 2.37.0

### Patch Changes

- 7dc1512: refactor: replace babel-preset-app with rsbuild babel-preset

  refactor: 将 babel-preset-app 替换为 rsbuild babel-preset

- Updated dependencies [383b636]
- Updated dependencies [ce0a14e]
- Updated dependencies [708f248]
  - @modern-js/utils@2.37.0
  - @modern-js/plugin@2.37.0

## 2.36.0

### Patch Changes

- Updated dependencies [3473bee]
- Updated dependencies [b98f8aa]
- Updated dependencies [eb602d2]
  - @modern-js/utils@2.36.0
  - @modern-js/plugin@2.36.0

## 2.35.1

### Patch Changes

- Updated dependencies [ea3fe18]
- Updated dependencies [14f95cf]
- Updated dependencies [9dd3151]
- Updated dependencies [4980480]
- Updated dependencies [6a1d46e]
  - @modern-js/utils@2.35.1
  - @modern-js/plugin@2.35.1

## 2.35.0

### Patch Changes

- Updated dependencies [15b834f]
  - @modern-js/utils@2.35.0
  - @modern-js/plugin@2.35.0

## 2.34.0

### Minor Changes

- 5240e5d: feat: ssr-preload.include support specify rel
  feat: ssr-preload.include 支持指定 rel 属性
- dcdeea5: feat: support disable pre-render
  feat: 支持禁用 pre-render

### Patch Changes

- f851fa9: fix: lazy import preload, then update include.type to include.as
  fix: 动态加载 preload 功能, 对齐规范将 include.type 属性更新为 include.as
- 7d70738: fix: some link shouldn't have as attributes
  fix: 一些 link 头不应该添加 as 属性
- Updated dependencies [a77b82a]
- Updated dependencies [c8b448b]
  - @modern-js/utils@2.34.0
  - @modern-js/plugin@2.34.0

## 2.33.1

### Patch Changes

- @modern-js/plugin@2.33.1
- @modern-js/utils@2.33.1

## 2.33.0

### Patch Changes

- Updated dependencies [fd82137]
- Updated dependencies [bc1f8da]
  - @modern-js/utils@2.33.0
  - @modern-js/plugin@2.33.0

## 2.32.1

### Patch Changes

- @modern-js/utils@2.32.1
- @modern-js/plugin@2.32.1

## 2.32.0

### Minor Changes

- 2447d64: feat: support ssr resources preload
  feat: 支持 ssr 资源预加载

### Patch Changes

- 6076166: fix: packaging errors found by publint

  fix: 修复 publint 检测到的 packaging 问题

- Updated dependencies [e5a3fb4]
- Updated dependencies [6076166]
- Updated dependencies [a030aff]
- Updated dependencies [3c91100]
- Updated dependencies [5255eba]
  - @modern-js/utils@2.32.0
  - @modern-js/plugin@2.32.0

## 2.31.2

### Patch Changes

- Updated dependencies [15d30abdc66]
  - @modern-js/utils@2.31.2
  - @modern-js/plugin@2.31.2

## 2.31.1

### Patch Changes

- @modern-js/plugin@2.31.1
- @modern-js/utils@2.31.1

## 2.31.0

### Patch Changes

- Updated dependencies [1882366]
  - @modern-js/utils@2.31.0
  - @modern-js/plugin@2.31.0

## 2.30.0

### Minor Changes

- a5ee81a: feat(server): add new server hooks `beforeServerInit` & `afterServerInit`
  feat(server): 添加新的服务端钩子 `beforeServerInit` & `afterServerInit`

### Patch Changes

- @modern-js/utils@2.30.0
- @modern-js/plugin@2.30.0

## 2.29.0

### Patch Changes

- Updated dependencies [e6b5355]
- Updated dependencies [93db783]
- Updated dependencies [cba7675]
- Updated dependencies [99052ea]
- Updated dependencies [1d71d2e]
  - @modern-js/utils@2.29.0
  - @modern-js/plugin@2.29.0

## 2.28.0

### Patch Changes

- Updated dependencies [00b58a7]
  - @modern-js/utils@2.28.0
  - @modern-js/plugin@2.28.0

## 2.27.0

### Patch Changes

- Updated dependencies [91d14b8]
- Updated dependencies [6d7104d]
  - @modern-js/utils@2.27.0
  - @modern-js/plugin@2.27.0

## 2.26.0

### Patch Changes

- @modern-js/plugin@2.26.0
- @modern-js/utils@2.26.0

## 2.25.2

### Patch Changes

- Updated dependencies [63d8247]
- Updated dependencies [6651684]
- Updated dependencies [272646c]
- Updated dependencies [358ed24]
  - @modern-js/utils@2.25.2
  - @modern-js/plugin@2.25.2

## 2.25.1

### Patch Changes

- Updated dependencies [9f78d0c]
  - @modern-js/utils@2.25.1
  - @modern-js/plugin@2.25.1

## 2.25.0

### Patch Changes

- Updated dependencies [5732c6a]
  - @modern-js/utils@2.25.0
  - @modern-js/plugin@2.25.0

## 2.24.0

### Patch Changes

- Updated dependencies [c882fbd]
- Updated dependencies [4a82c3b]
  - @modern-js/utils@2.24.0
  - @modern-js/plugin@2.24.0

## 2.23.1

### Patch Changes

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1
  - @modern-js/plugin@2.23.1

## 2.23.0

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [6dec7c2]
- Updated dependencies [c3216b5]
  - @modern-js/plugin@2.23.0
  - @modern-js/utils@2.23.0

## 2.22.1

### Patch Changes

- Updated dependencies [e2848a2]
- Updated dependencies [d4045ed]
  - @modern-js/utils@2.22.1
  - @modern-js/plugin@2.22.1

## 2.22.0

### Patch Changes

- Updated dependencies [3d48836]
- Updated dependencies [5050e8e]
  - @modern-js/utils@2.22.0
  - @modern-js/plugin@2.22.0

## 2.21.1

### Patch Changes

- @modern-js/plugin@2.21.1
- @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 43b4e83: feat: support security.nonce for add nonce attribute on script tag
  feat: 支持 security.nonce 配置，为 script 标签添加 nonce 属性
- Updated dependencies [e81eeaf]
- Updated dependencies [26dcf3a]
- Updated dependencies [056627f]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/utils@2.21.0
  - @modern-js/plugin@2.21.0

## 2.20.0

### Patch Changes

- 6b9d90a: chore: remove @babel/runtime. add @swc/helper and enable `externalHelper` config.
  chore: 移除 @babel/runtime 依赖. 增加 @swc/helpers 依赖并且开启 `externalHelpers` 配置
- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
  - @modern-js/utils@2.20.0
  - @modern-js/plugin@2.20.0

## 2.19.1

### Patch Changes

- @modern-js/plugin@2.19.1
- @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- Updated dependencies [1134fe2]
  - @modern-js/utils@2.19.0
  - @modern-js/plugin@2.19.0

## 2.18.1

### Patch Changes

- @modern-js/plugin@2.18.1
- @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- @modern-js/plugin@2.18.0
- @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/plugin@2.17.1
- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/plugin@2.17.0
- @modern-js/utils@2.17.0

## 2.16.0

### Patch Changes

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- Updated dependencies [5954330]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
  - @modern-js/utils@2.16.0
  - @modern-js/plugin@2.16.0

## 2.15.0

### Patch Changes

- @modern-js/plugin@2.15.0
- @modern-js/utils@2.15.0

## 2.14.0

### Patch Changes

- 8a3c693: chore(server): no longer replace globalVars when compiler is babel

  chore(server): 进行 babel compile 时不再替换 globalVars

- 9321bef: feat: adjust server.worker config to deploy.worker.ssr

  feat: 调整 server.worker 为 deploy.worker.ssr

- 60a81d0: feat: add ssr.inlineScript for use inline json instead inline script when ssr
  feat: 添加 ssr.inlineScript 用于在 ssr 模式下使用内联 json 而不是内联脚本
- Updated dependencies [4779152]
- Updated dependencies [9321bef]
- Updated dependencies [9b45c58]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/utils@2.14.0
  - @modern-js/plugin@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/plugin@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- @modern-js/plugin@2.13.3
- @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- @modern-js/plugin@2.13.2
- @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/plugin@2.13.1
- @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- Updated dependencies [78431f4]
  - @modern-js/plugin@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
  - @modern-js/utils@2.12.0
  - @modern-js/plugin@2.12.0

## 2.11.0

### Patch Changes

- Updated dependencies [cfb058f]
- Updated dependencies [0bd018b]
- Updated dependencies [5d624fd]
- Updated dependencies [e2466a1]
- Updated dependencies [02bb383]
- Updated dependencies [381a3b9]
- Updated dependencies [7a60f10]
- Updated dependencies [274b2e5]
- Updated dependencies [b9e1c54]
  - @modern-js/utils@2.11.0
  - @modern-js/plugin@2.11.0

## 2.10.0

### Patch Changes

- 3e0bd50: feat: when enable bff handle render, support use `useContext` to get framework plugin context in data loader.
  feat: 当开启 BFF 托管渲染时，支持在 data loader 中使用 `useContext` 获取框架插件提供的上下文。
- 0da32d0: chore: upgrade jest and puppeteer
  chore: 升级 jest 和 puppeteer 到 latest
- Updated dependencies [0da32d0]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/plugin@2.10.0
  - @modern-js/utils@2.10.0

## 2.9.0

### Patch Changes

- @modern-js/plugin@2.9.0
- @modern-js/utils@2.9.0

## 2.8.0

### Patch Changes

- Updated dependencies [1104a9f18b]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/utils@2.8.0
  - @modern-js/plugin@2.8.0

## 2.7.0

### Minor Changes

- 84bfb439b8: feat: support custom apiDir, lambdaDir and style of writing for bff
  feat: 支持定制 api 目录，lambda 目录，bff 的写法

### Patch Changes

- 1eea234fdd: chore: make test files naming consistent

  chore: 统一测试文件命名为小驼峰格式

- Updated dependencies [0f15fc597c]
- Updated dependencies [dcad887024]
- Updated dependencies [a4672f7c16]
- Updated dependencies [7fff9020e1]
- Updated dependencies [84bfb439b8]
  - @modern-js/utils@2.7.0
  - @modern-js/plugin@2.7.0

## 2.6.0

### Patch Changes

- Updated dependencies [e1f799e]
- Updated dependencies [7915ab3]
- Updated dependencies [0fe658a]
  - @modern-js/utils@2.6.0
  - @modern-js/plugin@2.6.0

## 2.5.0

### Patch Changes

- 89ca6cc: refactor: merge build-config into scripts/build

  refactor: 把 build-config 合并进 scripts/build

- 6fca567: feat: support bff handle complete server, include page render
  feat: 支持 bff 处理整个服务，包括页面渲染
- 30614fa: chore: modify package.json entry fields and build config
  chore: 更改 package.json entry 字段以及构建配置
- 11c053b: feat: ssr support deploy worker

  feat: ssr 支持边缘部署

- 169c58b: feat: support force csr config
  feat: 支持强制 CSR 的配置
- Updated dependencies [89ca6cc]
- Updated dependencies [30614fa]
- Updated dependencies [1b0ce87]
- Updated dependencies [11c053b]
  - @modern-js/plugin@2.5.0
  - @modern-js/utils@2.5.0

## 2.4.0

### Patch Changes

- Updated dependencies [98a2733]
- Updated dependencies [8c2db5f]
  - @modern-js/utils@2.4.0
  - @modern-js/plugin@2.4.0

## 2.3.0

### Patch Changes

- Updated dependencies [fd5a3ed]
- Updated dependencies [6ca1c0b]
- Updated dependencies [89b6739]
  - @modern-js/utils@2.3.0
  - @modern-js/plugin@2.3.0

## 2.2.0

### Patch Changes

- Updated dependencies [49eff0c]
  - @modern-js/utils@2.2.0
  - @modern-js/plugin@2.2.0

## 2.1.0

### Patch Changes

- Updated dependencies [837620c]
- Updated dependencies [8a9482c]
  - @modern-js/utils@2.1.0
  - @modern-js/plugin@2.1.0

## 2.0.2

### Patch Changes

- @modern-js/utils@2.0.2
- @modern-js/plugin@2.0.2

## 2.0.1

### Patch Changes

- @modern-js/plugin@2.0.1
- @modern-js/utils@2.0.1

## 2.0.0

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- Updated dependencies [edd1cfb1af]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [ffb2ed4]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/utils@2.0.0
  - @modern-js/plugin@2.0.0

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- Updated dependencies [edd1cfb1af]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/utils@2.0.0-beta.7
  - @modern-js/plugin@2.0.0-beta.7

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- Updated dependencies [7879e8f711]
- Updated dependencies [6aca875011]
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
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06257]
- Updated dependencies [bbe4c4ab64]
- Updated dependencies [e4558a0bc4]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.6
  - @modern-js/plugin@2.0.0-beta.6

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- Updated dependencies [7879e8f]
- Updated dependencies [6aca875]
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
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.4
  - @modern-js/plugin@2.0.0-beta.4

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- Updated dependencies [6aca875]
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
- Updated dependencies [f179749375]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.3
  - @modern-js/plugin@2.0.0-beta.3

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [f179749]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/utils@2.0.0-beta.2
  - @modern-js/plugin@2.0.0-beta.2

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c8: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- Updated dependencies [92f0ead]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [f179749]
- Updated dependencies [abf3421]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712d]
  - @modern-js/utils@2.0.0-beta.1
  - @modern-js/plugin@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- 543be95: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 15bf09d9c: feat: support completely custom server, export render() api for render single page
  feat: 支持完全自定义 Server，导出 render() 方法用来渲染单个页面
- cc971eabf: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
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
  - @modern-js/utils@2.0.0-beta.0
  - @modern-js/plugin@2.0.0-beta.0

## 1.21.2

### Patch Changes

- 9d4c0ba: chore: add types for exports field
  chore: 为 exports 补充 types 字段
- Updated dependencies [9d4c0ba]
  - @modern-js/plugin@1.21.2
  - @modern-js/utils@1.21.2

## 1.21.1

### Patch Changes

- @modern-js/plugin@1.21.1
- @modern-js/utils@1.21.1

## 1.21.0

### Patch Changes

- Updated dependencies [28f0a4f]
  - @modern-js/plugin@1.21.0
  - @modern-js/utils@1.21.0

## 1.20.1

### Patch Changes

- Updated dependencies [49515c5]
  - @modern-js/utils@1.20.1
  - @modern-js/plugin@1.20.1

## 1.20.0

### Patch Changes

- Updated dependencies [d5d570b]
- Updated dependencies [4ddc185]
- Updated dependencies [df8ee7e]
- Updated dependencies [8c05089]
  - @modern-js/utils@1.20.0
  - @modern-js/plugin@1.20.0

## 1.19.0

### Patch Changes

- @modern-js/plugin@1.19.0
- @modern-js/utils@1.19.0

## 1.18.1

### Patch Changes

- Updated dependencies [c1a4d9b]
- Updated dependencies [9fcfbd4]
- Updated dependencies [6c2c745]
  - @modern-js/plugin@1.18.1
  - @modern-js/utils@1.18.1

## 1.18.0

### Patch Changes

- 3d5e3a5: chore: get api mode from bff core
  chore: 从 bff core 中获取 api mode
- Updated dependencies [8280920]
- Updated dependencies [5227370]
- Updated dependencies [7928bae]
  - @modern-js/utils@1.18.0
  - @modern-js/plugin@1.18.0

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
  - @modern-js/plugin@1.17.0

## 1.16.0

### Minor Changes

- 1100dd58c: chore: support react 18

  chore: 支持 React 18

### Patch Changes

- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
  - @modern-js/utils@1.16.0
  - @modern-js/plugin@1.16.0

## 1.15.0

### Patch Changes

- Updated dependencies [8658a78]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [37cd159]
  - @modern-js/utils@1.15.0
  - @modern-js/plugin@1.15.0

## 1.4.1

### Patch Changes

- a27ab8d: feat: add onApiChange hook for bff hot reload
  feat: 为 BFF 热更新优化，添加 onApiChange 钩子
  - @modern-js/utils@1.7.12

## 1.4.0

### Minor Changes

- 77a8e9e: feat: support bff operators

### Patch Changes

- f29e9ba: feat: simplify context usage, no longer depend on containers
- a90bc96: perf(babel): skip babel-plugin-import if package not installed
- Updated dependencies [f29e9ba]
- Updated dependencies [a90bc96]
  - @modern-js/plugin@1.4.0
  - @modern-js/utils@1.7.9

## 1.3.5

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d5913bd96]
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/plugin@1.3.4
  - @modern-js/utils@1.7.3

## 1.3.4

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2

## 1.3.3

### Patch Changes

- 6fa74d5f: add internal metrics and logger
- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/utils@1.7.0

## 1.3.2

### Patch Changes

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

## 1.3.1

### Patch Changes

- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/plugin@1.3.3

## 1.3.0

### Minor Changes

- d2d1d6b2: feat: support server config

### Patch Changes

- d2d1d6b2: feat: add prepare hook
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/utils@1.4.0

## 1.2.5

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- Updated dependencies [132f7b53]
  - @modern-js/utils@1.3.7

## 1.2.4

### Patch Changes

- a8df060e: support setup dev middleware first step
- 18db013a: support load plugin instace
- Updated dependencies [c2046f37]
- Updated dependencies [dc88abf9]
- Updated dependencies [0462ff77]
  - @modern-js/utils@1.3.6
  - @modern-js/plugin@1.3.2

## 1.2.3

### Patch Changes

- d95f28c3: should enable babel register before server plugin require
- 2e8dec93: feat: adust `ServerPlugin` type to define new plugin
- 2008fdbd: convert two packages server part, support server load plugin itself
- 2e8dec93: add `useAppContext`、`useConfigContext` to plugin api
- Updated dependencies [5bf5868d]
- Updated dependencies [80d8ddfe]
- Updated dependencies [491145e3]
  - @modern-js/utils@1.3.5
  - @modern-js/plugin@1.3.0

## 1.2.2

### Patch Changes

- 272cab15: refactor server plugin manager

## 1.2.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
  - @modern-js/plugin@1.2.1

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- Updated dependencies [cfe11628]
  - @modern-js/plugin@1.2.0

## 1.1.4

### Patch Changes

- e51b1db3: feat: support custom sdk, interceptor, headers for bff request

## 1.1.3

### Patch Changes

- e04914ce: add route types, fix metrics types
- e04914ce: add route types, fix metrics types

## 1.1.2

### Patch Changes

- 085a6a58: refactor server plugin
- 085a6a58: refactor server plugin
- 085a6a58: refactor server conifg
- 085a6a58: support server runtime
- 085a6a58: feat: refactor server plugin

## 1.1.1

### Patch Changes

- 0fa83663: support more .env files
- Updated dependencies [0fa83663]
  - @modern-js/plugin@1.1.2

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
