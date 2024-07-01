# @modern-js/utils

## 2.54.5

## 2.54.4

## 2.54.3

## 2.54.2

## 2.54.1

## 2.54.0

### Minor Changes

- a8d8f0c: feat: support new server plugin & discard server plugin some hooks
  feat: 支持新 server plugin & 减少 server plugin 钩子

### Patch Changes

- 15a090c: feat: refactor app-tools command and analyze check entry point

  feat: 重构 app-tools 命令和 analyze 插件识别入口逻辑

- 09798ac: feat: refactor runtime plugin

  feat: 重构 runtime 插件

## 2.53.0

## 2.52.0

## 2.51.0

## 2.50.0

## 2.49.4

## 2.49.3

## 2.49.2

## 2.49.1

## 2.49.0

### Minor Changes

- e8c8c5d: refactor: refactor server
  refactor: 重构 server

## 2.48.6

## 2.48.5

### Patch Changes

- 4ca9f4c: fix: remove `node:` prefix
  fix: 移除 `node:` 前缀

## 2.48.4

### Patch Changes

- 7d2d433: fix: we should override server.baseUrl when merge it
  fix: 在合并 server.baseUrl 时，我们应该覆盖他

## 2.48.3

## 2.48.2

## 2.48.1

### Patch Changes

- 8942b90: perf(utils): remove unused schema-utils3 package

  perf(utils): 移除 schema-utils3 包

- ce426f7: fix(server): print ipv6 url correctly

  fix(server): 正确打印 ipv6 url

## 2.48.0

### Patch Changes

- c323a23: feat: separate new & upgrade action from solutions
  feat: 从工程方案中分离 new & upgrade 命令

## 2.47.1

## 2.47.0

### Patch Changes

- a5386ab: fix(deps): bump semver to v7.6.0

  fix(deps): 升级 semver 到 v7.6.0

## 2.46.1

## 2.46.0

## 2.45.0

## 2.44.0

## 2.43.0

## 2.42.2

## 2.42.1

## 2.42.0

## 2.41.0

### Patch Changes

- c4d396a: chore(swc): bump swc and helpers
  chore(swc): 升级 swc 以及 helpers

## 2.40.0

### Minor Changes

- 95f15d2: chore: remove ajv schema verification of configuration
  chore: 移除 ajv 对项目配置的校验

## 2.39.2

## 2.39.1

## 2.39.0

## 2.38.0

## 2.37.2

## 2.37.1

## 2.37.0

### Minor Changes

- ce0a14e: feat: support shouldRevalidate
  feat: 支持 shouldRevalidate

### Patch Changes

- 383b636: chore: replace babel-preset-base with rsbuild babel-preset

  chore: 替换 babel-preset-base 为 rsbuild babel-preset

- 708f248: fix(utils): bump rslog@1.1.0 to fix color support detection

  fix(utils): 升级 rslog@1.1.0 并修复 color 支持检测

## 2.36.0

### Patch Changes

- 3473bee: chore: remove legacy monorepo include and unused utils

  chore: 移除旧版的 monorepo include 逻辑和未使用的 utils

- b98f8aa: feat: using rslog as logger

  feat: 使用 rslog 作为 logger

- eb602d2: chore(builder): bump webpack-dev-middleware v6.1.1 and move to builder-shared

  chore(builder): 升级 webpack-dev-middleware v6.1.1 并移动到 builder-shared

## 2.35.1

### Patch Changes

- ea3fe18: feat(app-tools): make logs easier to read

  feat(app-tools): 让日志更容易阅读

- 9dd3151: chore(app-tools): add RouterPlugin name
  chore(app-tools): 增加 RouterPlugin 名称
- 4980480: chore(prod-server): remove duplicated logger module

  chore(prod-server): 移除重复的 logger 模块

- 6a1d46e: refactor: split runtime utils into a seperate package
  refactor: runtime utils 单独拆分成一个包

## 2.35.0

### Patch Changes

- 15b834f: feat(CLI): print gradient text for initial log

  feat(CLI): 输出 initial log 时使用渐变色文字

## 2.34.0

### Patch Changes

- a77b82a: fix: upgrade react-router-dom to avoid issues
  fix: 升级 react-router-dom 的版本，避免问题
- c8b448b: feat(builder): support inline assets by file size

  feat(builder): 支持基于文件体积来内联资源

## 2.33.1

## 2.33.0

### Patch Changes

- fd82137: chore(utils): remove no longer used recursive-readdir

  chore(utils): 移除不再使用的 recursive-readdir 方法

- bc1f8da: feat(builder): support custom logger in dev server

  feat(builder): 支持自定义 logger

## 2.32.1

## 2.32.0

### Minor Changes

- a030aff: feat: support loader context
  feat: 支持 loader context

### Patch Changes

- e5a3fb4: fix: integration test, and export LoaderContext from utils
  fix: 集成测试，然后导出 LoaderContext
- 6076166: fix: packaging errors found by publint

  fix: 修复 publint 检测到的 packaging 问题

- 3c91100: chore(builder): using unified version of webpack-chain

  chore(builder): 使用统一的 webpack-chain 版本

- 5255eba: feat: report time for server loader
  feat: 上报 server loader 执行的时间

## 2.31.2

### Patch Changes

- 15d30abdc66: fix: @modern-js/utils npm sync error

  fix: 修复 @modern-js/utils 包 npm 同步失败

## 2.31.1

## 2.31.0

### Patch Changes

- 1882366: chore(deps): bump build dependencies

  chore(deps): 升级构建相关依赖

## 2.30.0

## 2.29.0

### Minor Changes

- cba7675: feat: add a server reporter that report server cost, logger about error, info etc.
  feat: 添加一个 server 端 reporter，来报告 server 端耗时，报错等

### Patch Changes

- e6b5355: feat(utils): change the color of error stacks to gray

  feat(utils): 将 error stack 的颜色改为灰色

- 93db783: fix(utils): remove hard code 'main'

  fix(utils): 移除 'main' 硬编码

- 99052ea: feat(builder): improve error stacks if dev compilation failed

  feat(builder): 优化 dev 编译失败时的错误堆栈格式

- 1d71d2e: fix(@modern-js/utils): add missing url in devServer console
  fix(@modern-js/utils): 修复 devServer console 中丢失的 url

## 2.28.0

### Patch Changes

- 00b58a7: feat(builder): add an error tip for source.include

  feat(builder): 增加 source.include 常见问题的提示日志

## 2.27.0

### Patch Changes

- 91d14b8: fix(utils): using universal build config and fix compatibility issue

  fix(utils): 使用 universal 构建配置，修复兼容性问题

- 6d7104d: fix(builder): should not strip error stacks

  fix(builder): 不应该移除错误堆栈

## 2.26.0

## 2.25.2

### Patch Changes

- 63d8247: fix(utils): incorrect ora & commander exports path

  fix(utils): 修复错误的 ora & commander 导出路径

- 6651684: fix(app-tools): failed to print error stack

  fix(app-tools): 修复 build 报错时未打印错误堆栈的问题

- 272646c: feat(builder): bump webpack v5.88, support top level await

  feat(builder): 升级 webpack v5.88, 支持 top level await

- 358ed24: fix: support configuration ts-node and avoid to register ts-node unnecessarily
  fix: 支持配置 ts-node，避免对 ts-node 不必要的注册

## 2.25.1

### Patch Changes

- 9f78d0c: fix: react-router-dom version

  fix: 修复 react-router-dom 版本

## 2.25.0

### Patch Changes

- 5732c6a: feat: support for fallback SSR using request header fields
  feat: 支持通过请求头字段来降级 SSR

## 2.24.0

### Patch Changes

- c882fbd: feat: support config main entry name

  feat: 支持配置主入口名称

- 4a82c3b: fix: export `@remix-run/router` cjs instead of `react-router-dom`
  fix: 暴露 `@remix-run/router` 的 cjs 导出代替 `react-router-dom`

## 2.23.1

### Patch Changes

- f08bbfc: feat(builder): add basic Vue 3 plugin

  feat(builder): 增加基础的 Vue 3 插件

- a6b313a: fix(builder): can't use new React JSX with parent's package.json

  fix(builder): 修复 package.json 在父级目录时无法使用新版 react jsx 的问题

- 8f2cab0: feat(builder): support using new URL to handle wasm assets

  feat(builder): 支持通过 new URL 来处理 wasm 资源

## 2.23.0

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- a7a7ad7: chore: move some public code to the utils package
  chore: 移动一些公共的代码到 utils 包
- 6dec7c2: test(utils): reuse the snapshot serializer of vitest config

  test(utils): 复用 vitest 的 snapshot serializer

- c3216b5: chore: split the scheme into the plugin

  chore: 拆分 scheme 到插件内部

## 2.22.1

### Patch Changes

- e2848a2: fix: support nonce in streaming SSR
  fix: 在 streaming SSR 中支持 nonce
- d4045ed: fix(builder): print https URLs when devServer.https is true

  fix(builder): 当 devServer.https 为 true 时，输出 https 的 URLs

## 2.22.0

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- 5050e8e: fix: browser should get last element that server insert to html for baseUrl
  fix: 浏览器需要获取最后一个 Server 注入 HTML 的 baseUrl 数据

## 2.21.1

## 2.21.0

### Minor Changes

- 056627f: fix(plugin-sass): pollute the `global.location` object
  fix(plugin-sass): 污染全局对象 `global.location`

### Patch Changes

- e81eeaf: refactor: guard react-router version consistency
  refactor: 保证 react-router 相关包的版本一致性
- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 0fc15ca: fix: fix `@modern-js/utils` subpath exports
  fix: 修复 `@modern-js/utils` 子路径导出
- 43b4e83: feat: support security.nonce for add nonce attribute on script tag
  feat: 支持 security.nonce 配置，为 script 标签添加 nonce 属性
- ad78387: chore(deps): bump babel-related dependencies to latest version

  chore(deps): 升级 babel 相关依赖到最新版本

## 2.20.0

### Patch Changes

- 3c4e0a5: chore(utils): move generateMetaTags method to builder-shared

  chore(utils): 移动 generateMetaTags 方法到 builder-shared

- 6b9d90a: chore: remove @babel/runtime. add @swc/helper and enable `externalHelper` config.
  chore: 移除 @babel/runtime 依赖. 增加 @swc/helpers 依赖并且开启 `externalHelpers` 配置

## 2.19.1

## 2.19.0

### Patch Changes

- 1134fe2: chore(deps): bump webpack from 5.76.2 to 5.82.1

  chore(deps): 将 webpack 从 5.76.2 升级至 5.82.1

## 2.18.1

## 2.18.0

## 2.17.1

## 2.17.0

## 2.16.0

### Minor Changes

- 7596520: feat(builder): builder plugin supports specifying relative order via the `pre` / `post` configuration items

  feat(builder): builder 插件支持通过 `pre` / `post` 配置项指定相对顺序

### Patch Changes

- 5954330: fix: route id should not include [ or ]
  fix: 路由 id 不应该包含 [ 或 ]
- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

## 2.15.0

## 2.14.0

### Minor Changes

- 16399fd: feat: support extendPageData hook and last updated time

  feat: 支持 extendPageData 钩子和最后更新时间功能

### Patch Changes

- 4779152: fix(utils): the esm format files should be generate for the client

  fix(utils): 应该为客户端使用，生成 esm 格式的文件

- 9321bef: feat: adjust server.worker config to deploy.worker.ssr

  feat: 调整 server.worker 为 deploy.worker.ssr

- 9b45c58: fix(app-tools): should not print all addresses when custom dev.host

  fix(app-tools): 修复自定义 dev.host 时会输出多余的 URL 地址的问题

- 52d0cb1: feat: support config handle of Route
  feat: 支持配置 Route 的 handle 属性
- 60a81d0: feat: add ssr.inlineScript for use inline json instead inline script when ssr
  feat: 添加 ssr.inlineScript 用于在 ssr 模式下使用内联 json 而不是内联脚本
- dacef96: chore: remove plugin-egg and plugin-nest
  chore: 移除 plugin-egg 和 plugin-nest

## 2.13.4

## 2.13.3

## 2.13.2

## 2.13.1

## 2.13.0

## 2.12.0

### Patch Changes

- c2ca6c8: fix(app-tools): failed to restart CLI

  fix(app-tools): 修复 CLI 重启失败的问题

- 6d86e34: feat(doc-tools): print dev server URLs with base

  feat(doc-tools): 输出 dev server 的 URLs 时补全 base 信息

## 2.11.0

### Patch Changes

- cfb058f: fix(builder): remove duplicated babel-plugin-import

  fix(builder): 移除重复注册的 babel-plugin-import

- 0bd018b: feat: support use node api run dev & build & deploy command
  feat: 支持通过 node api 运行 dev & build & deploy 命令
- 5d624fd: feat: assets and data prefetching is supported
  feat: 支持资源和数据预加载
- e2466a1: fix: remove nestedRoutes file from @modern-js/utils
  fix: 将 nestedRoutes 从 @modern-js/utils 中移除
- 02bb383: fix: fix lost props when using nested route in micro-front-end mode
  修复嵌套路由在微前端场景下主子应用传递 props 丢失问题
- 381a3b9: feat(utils): move universal utils to the universal folder

  feat(utils): 将运行时使用的 utils 移动到 universal 目录

- 7a60f10: chore(utils): bump commander from v8 to v10

  chore(utils): 将 commander 从 v8 升级到 v10

- 274b2e5: fix: For rspack-provider can use `tools.babel` configuration, inline the `@babel/preset-typescript` to handle ts syntax in rspack-provider.
  fix: 为了 rspack-provider 能给使用 `tools.babel` 配置项，将 `@babel/preset-typescript` 内置进 rspack-provider 去处理 ts 语法。
- b9e1c54: fix(utils): remove useless oneOf chainId，avoid user usage error.

  fix(utils): 移除无用的 oneOf chainId，防止用户使用异常

## 2.10.0

### Patch Changes

- 0da32d0: chore: upgrade jest and puppeteer
  chore: 升级 jest 和 puppeteer 到 latest
- fbefa7e: chore(deps): bump webpack from 5.75.0 to 5.76.2

  chore(deps): 将 webpack 从 5.75.0 升级至 5.76.2

- 4d54233: chore(builder): update rspack & show rspack format error

  chore(builder): 更新 rspack 版本 & 优化 rspack 错误日志输出

- 6db4864: feat: add output.splitRouteChunks
  feat: 添加 output.splitRouteChunks 配置

## 2.9.0

## 2.8.0

### Patch Changes

- 1104a9f18b: feat: support start web service only
  feat: 支持只启动 web 服务
- 1f6ca2c7fb: fix: nested routes in ssg
  fix: 修复嵌套路由在 SSG 中的问题

## 2.7.0

### Minor Changes

- dcad887024: feat: support deferred data for streaming ssr
  feat: 流式渲染支持 deferred data
- 84bfb439b8: feat: support custom apiDir, lambdaDir and style of writing for bff
  feat: 支持定制 api 目录，lambda 目录，bff 的写法

### Patch Changes

- 0f15fc597c: fix: remove nestedRoutes export
  fix: 移除 nestedRoutes 导出
- a4672f7c16: fix: lock @modern-js/utils/ssr by webpack alias
  fix: 通过 webpack 别名将 @modern-js/utils/ssr 锁到同一版本
- 7fff9020e1: chore: make file naming consistent

  chore: 统一文件命名为小驼峰格式

## 2.6.0

### Patch Changes

- e1f799e: fix: use 0.0.0.0 instead of localhost as the default dev host
  fix: 使用 0.0.0.0 代替 localhost 作为默认的 dev host
- 7915ab3: fix: should not assign nestedRoutesEntry to entrypoint if use v5 router
  fix: 使用 v5 路由的时候，不应该在 entrypoint 上挂载 nestedRoutesEntry 属性
- 0fe658a: feat(builder): support passing URL to html.favicon

  feat(builder): 支持在 html.favicon 中直接传入 URL

## 2.5.0

### Patch Changes

- 30614fa: chore: modify package.json entry fields and build config
  chore: 更改 package.json entry 字段以及构建配置
- 1b0ce87: chore: bump caniuse-lite to latest version

  chore: 升级 caniuse-lite 到最新版

- 11c053b: feat: ssr support deploy worker

  feat: ssr 支持边缘部署

## 2.4.0

### Patch Changes

- 98a2733: fix(tailwind): fix webpack cache not work when using twin.macro

  fix(tailwind): 修复使用 twin.macro 时 webpack 缓存不生效的问题

- 8c2db5f: feat(core): improve support for exporting a function in config file

  feat(core): 完善对配置文件中导出函数的支持

## 2.3.0

### Patch Changes

- fd5a3ed: fix: failed to exit new command

  fix: 修复 new 命令执行完成后未退出进程的问题

- 6ca1c0b: fix: .ejs is not a valid config file extension

  fix: 修复配置文件使用 .ejs 作为后缀的问题

- 89b6739: fix(utils): fix pre-bundled ajv types

  fix(utils): 修复预打包后的 ajv 中的类型问题

## 2.2.0

### Patch Changes

- 49eff0c: fix(utils): bump json5 to fix security issue

  fix(utils): 升级 json5 以修复安全问题

## 2.1.0

### Minor Changes

- 8a9482c: feat(builder): add new option `html.tags` & `html.tagsByEntries`

  feat(builder): 添加新的配置项 `html.tags` 和 `html.tagsByEntries`

### Patch Changes

- 837620c: fix: Disable detect tsconfig.json
  fix: 禁用探测 tsconfig.json

## 2.0.2

## 2.0.1

## 2.0.0

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- bbe4c4ab64: feat: add @modern-js/plugin-swc

  feat: 新增 @modern-js/plugin-swc 插件

### Patch Changes

- ffb2ed4: feat:

  1. change storybook runtime logic
  2. export runtime api define from runtime module
  3. refactor defineConfig in module-tools

  feat:

  1. 更改 Storybook 对于 Runtime API 的处理逻辑
  2. 从 @modern-js/runtime 导出 Runtime API 的用户配置
  3. 重构 module-tools 的 defineConfig

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- bbe4c4ab64: feat: add @modern-js/plugin-swc

  feat: 新增 @modern-js/plugin-swc 插件

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0eade39: feat:

  1. core: 增加 test 函数
  2. module plugins: 增加 `babel`, `mainField`, `target` 插件
  3. storybook: 修改部分逻辑并且增加 tspath webpack 插件
  4. 增加 designSystem 配置

  feat:

  1. core: add test method
  2. module plugins: add `babel`, `mainField`, `target` plugin
  3. storybook: change some logic and add tspath webpack plugin
  4. add `designSystem` config

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- d5a31df781: refactor: remove unbundle configs and types

  refactor: 移除 unbundle 相关的配置项和类型定义

- b710adb843: feat: extract the data loader
  feat: 提取 data loader
- bbe4c4ab64: feat: add @modern-js/plugin-swc

  feat: 新增 @modern-js/plugin-swc 插件

- e4558a0bc4: feat:

  1. add `runBin` function
  2. config internal plugins constants in the app/module/doc tools
  3. add app/module/doc tools internal plugins

  feat:

  1. 添加 `runBin` 函数
  2. 在 app/module/doc tools 里配置内部插件
  3. 增加 app/module/doc tools 使用的插件常量

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 7879e8f711: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- 6aca875011: fix: remove phantom webpack dependencies in node-polyfill and webpack-dev-middleware
  fix: 移除 node-polyfill 插件和 webpack-dev-middleware 中对 webpack 的幻影依赖
- 2e6031955e: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- 7b7d12cf8f: refactor: Substract getCorejsVersion to the util package, so that swc plugin can reuse it.
  refactor: 将 getCorejsVersion 提取到 util 包，让 swc 插件可以复用其逻辑
- 7efeed4: feat: add swc_polyfill_checker plugin.
  feat: 加入了 swc 检查 polyfill 插件.
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 5b9049f2e9: feat: inject async js chunk when streaming ssr
  feat: streaming ssr 时, 注入 async 类型的 js chunk
- 92004d1906: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- b8bbe036c7: feat: change type logic
  feat: 修改类型相关的逻辑
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- ea7cf06257: chore: bump webpack/babel-loader/postcss-loader/tsconfig-paths

  chore: 升级 webpack/babel-loader/postcss-loader/tsconfig-paths 版本

- abf3421a75: fix(dev-server): isDepsExists add non pkgPath judege

  修复: isDepsExists 方法添加 package.json 不存在的兜底

- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0eade39: feat:

  1. core: 增加 test 函数
  2. module plugins: 增加 `babel`, `mainField`, `target` 插件
  3. storybook: 修改部分逻辑并且增加 tspath webpack 插件
  4. 增加 designSystem 配置

  feat:

  1. core: add test method
  2. module plugins: add `babel`, `mainField`, `target` plugin
  3. storybook: change some logic and add tspath webpack plugin
  4. add `designSystem` config

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- d5a31df781: refactor: remove unbundle configs and types

  refactor: 移除 unbundle 相关的配置项和类型定义

- b710adb843: feat: extract the data loader
  feat: 提取 data loader
- bbe4c4a: feat: add @modern-js/plugin-swc

  feat: 新增 @modern-js/plugin-swc 插件

- e4558a0: feat:

  1. add `runBin` function
  2. config internal plugins constants in the app/module/doc tools
  3. add app/module/doc tools internal plugins

  feat:

  1. 添加 `runBin` 函数
  2. 在 app/module/doc tools 里配置内部插件
  3. 增加 app/module/doc tools 使用的插件常量

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 7879e8f: refactor: remove enableModernMode config

  refactor: 不再支持 enableModernMode 配置项

- 6aca875: fix: remove phantom webpack dependencies in node-polyfill and webpack-dev-middleware
  fix: 移除 node-polyfill 插件和 webpack-dev-middleware 中对 webpack 的幻影依赖
- 2e6031955e: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- 7b7d12c: refactor: Substract getCorejsVersion to the util package, so that swc plugin can reuse it.
  refactor: 将 getCorejsVersion 提取到 util 包，让 swc 插件可以复用其逻辑
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 5b9049f2e9: feat: inject async js chunk when streaming ssr
  feat: streaming ssr 时, 注入 async 类型的 js chunk
- 92004d1906: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- b8bbe036c7: feat: change type logic
  feat: 修改类型相关的逻辑
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- ea7cf06: chore: bump webpack/babel-loader/postcss-loader/tsconfig-paths

  chore: 升级 webpack/babel-loader/postcss-loader/tsconfig-paths 版本

- abf3421a75: fix(dev-server): isDepsExists add non pkgPath judege

  修复: isDepsExists 方法添加 package.json 不存在的兜底

- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0eade39: feat:

  1. core: 增加 test 函数
  2. module plugins: 增加 `babel`, `mainField`, `target` 插件
  3. storybook: 修改部分逻辑并且增加 tspath webpack 插件
  4. 增加 designSystem 配置

  feat:

  1. core: add test method
  2. module plugins: add `babel`, `mainField`, `target` plugin
  3. storybook: change some logic and add tspath webpack plugin
  4. add `designSystem` config

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- d5a31df781: refactor: remove unbundle configs and types

  refactor: 移除 unbundle 相关的配置项和类型定义

- b710adb: feat: extract the data loader
  feat: 提取 data loader
- bbe4c4a: feat: add @modern-js/plugin-swc

  feat: 新增 @modern-js/plugin-swc 插件

- e4558a0: feat:

  1. add `runBin` function
  2. config internal plugins constants in the app/module/doc tools
  3. add app/module/doc tools internal plugins

  feat:

  1. 添加 `runBin` 函数
  2. 在 app/module/doc tools 里配置内部插件
  3. 增加 app/module/doc tools 使用的插件常量

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- 6aca875: fix: remove phantom webpack dependencies in node-polyfill and webpack-dev-middleware
  fix: 移除 node-polyfill 插件和 webpack-dev-middleware 中对 webpack 的幻影依赖
- 2e60319: fix: some optimizations for router and loader
  fix: 一些 router 和 loader 的优化
  q
- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 5b9049f2e9: feat: inject async js chunk when streaming ssr
  feat: streaming ssr 时, 注入 async 类型的 js chunk
- 92004d1906: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- b8bbe036c7: feat: change type logic
  feat: 修改类型相关的逻辑
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- ea7cf06: chore: bump webpack/babel-loader/postcss-loader/tsconfig-paths

  chore: 升级 webpack/babel-loader/postcss-loader/tsconfig-paths 版本

- abf3421a75: fix(dev-server): isDepsExists add non pkgPath judege

  修复: isDepsExists 方法添加 package.json 不存在的兜底

- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- 92f0ead: feat:

  1. core: 增加 test 函数
  2. module plugins: 增加 `babel`, `mainField`, `target` 插件
  3. storybook: 修改部分逻辑并且增加 tspath webpack 插件
  4. 增加 designSystem 配置

  feat:

  1. core: add test method
  2. module plugins: add `babel`, `mainField`, `target` plugin
  3. storybook: change some logic and add tspath webpack plugin
  4. add `designSystem` config

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- d5a31df781: refactor: remove unbundle configs and types

  refactor: 移除 unbundle 相关的配置项和类型定义

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 5b9049f2e9: feat: inject async js chunk when streaming ssr
  feat: streaming ssr 时, 注入 async 类型的 js chunk
- 92004d1: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- b8bbe036c7: feat: change type logic
  feat: 修改类型相关的逻辑
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- abf3421a75: fix(dev-server): isDepsExists add non pkgPath judege

  修复: isDepsExists 方法添加 package.json 不存在的兜底

- 14b712da84: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- 92f0ead: feat:

  1. core: 增加 test 函数
  2. module plugins: 增加 `babel`, `mainField`, `target` 插件
  3. storybook: 修改部分逻辑并且增加 tspath webpack 插件
  4. 增加 designSystem 配置

  feat:

  1. core: add test method
  2. module plugins: add `babel`, `mainField`, `target` plugin
  3. storybook: change some logic and add tspath webpack plugin
  4. add `designSystem` config

- edd1cfb1af: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- d5a31df781: refactor: remove unbundle configs and types

  refactor: 移除 unbundle 相关的配置项和类型定义

- 543be9558e: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- cc971eabfc: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 5b9049f: feat: inject async js chunk when streaming ssr
  feat: streaming ssr 时, 注入 async 类型的 js chunk
- 92004d1: feat: support load chunks parallelly
  feat: 支持并行加载 chunks
- b8bbe036c7: feat: change type logic
  feat: 修改类型相关的逻辑
- 3bbea92b2a: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- abf3421: fix(dev-server): isDepsExists add non pkgPath judege

  修复: isDepsExists 方法添加 package.json 不存在的兜底

- 14b712d: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Minor Changes

- edd1cfb1a: feat: modernjs Access builder compiler
  feat: modernjs 接入 builder 构建
- d5a31df78: refactor: remove unbundle configs and types

  refactor: 移除 unbundle 相关的配置项和类型定义

- 543be95: feat: compile server loader and support handle loader request
  feat: 编译 server loader 并支持处理 loader 的请求

### Patch Changes

- cc971eabf: refactor: move server plugin load logic in `@modern-js/core`
  refactor：移除在 `@modern-js/core` 中的 server 插件加载逻辑
- 5b9049f: feat: inject async js chunk when streaming ssr
  feat: streaming ssr 时, 注入 async 类型的 js chunk
- b8bbe036c: feat: change type logic
  feat: 修改类型相关的逻辑
- 3bbea92b2: feat: support Hook、Middleware new API
  feat: 支持 Hook、Middleware 的新 API
- abf3421: fix(dev-server): isDepsExists add non pkgPath judege

  修复: isDepsExists 方法添加 package.json 不存在的兜底

- 14b712d: fix: use consistent alias type and default value across packages

  fix: 在各个包中使用一致的 alias 类型定义和默认值

## 1.21.2

## 1.21.1

## 1.21.0

## 1.20.1

### Patch Changes

- 49515c5: fix(utils): failed to call logger.success method

  fix(utils): 修复调用 logger.success 出现异常的问题

## 1.20.0

### Patch Changes

- d5d570b: feat: optimize the logger of @modern-js/utils, remove builder logger

  feat: 优化 @modern-js/utils 的 logger 格式, 移除 builder 内置的 logger

- 4ddc185: chore(builder): bump webpack to 5.74.0

  chore(builder): 升级 webpack 到 5.74.0 版本

- df8ee7e: fix(utils): failed to resolve execa

  fix(utils): 修复找不到 execa 模块的问题

- 8c05089: fix: support monorepo deploy in pnpm 7
  fix: 修复 monorepo deploy 命令在 pnpm 7 下的问题

## 1.19.0

## 1.18.1

### Patch Changes

- 9fcfbd4: chore: add assets retry plugin

  chore: 增加资源重试插件

- 6c2c745: chore(utils): add RULE.JS_DATA_URI to CHAIN_ID

  chore(utils): CHAIN_ID 增加 RULE.JS_DATA_URI 值

## 1.18.0

### Minor Changes

- 5227370: feat: add builder plugin subresource-integrity
  feat: 新增 builder 插件 subresource-integrity

### Patch Changes

- 8280920: feat: change hmr sock path to /webpack-hmr

  feat: 热更新 socket 请求的 path 修改为 /webpack-hmr

- 7928bae: chore: add inspector plugin

  chore: 增加 Inspector 插件

## 1.17.0

### Minor Changes

- 1b9176f: feat(utils): add TOML to CHAIN_ID.RULE

  feat(utils): 向 CHAIN_ID.RULE 中增加新常量 TOML

### Patch Changes

- 77d3a38: feat: runtime export utils not write d.ts file

  feat: runtime 生成 export 函数不再支持生成 d.ts 文件

- 151329d: chore(dev-server): no longer depend on @modern-js/webpack

  chore(dev-server): 不再依赖 @modern-js/webpack

- 5af9472: feat(utils): add PUG to CHAIN_ID

  feat(utils): CHAIN_ID 常量新增 PUG 值

- 6b6a534: chore: export getAddressUrls method

  chore: 导出 getAddressUrls 方法

- 6b43a2b: feat(utils): add SVG_ASSET to CHAIN_ID

  feat(utils): CHAIN_ID 常量新增 SVG_ASSET 值

- a7be124: feat(utils): add MODULE_DEPENDENCY_ERROR to CHAIN_ID

  feat(utils): CHAIN_ID 常量新增 MODULE_DEPENDENCY_ERROR 值

- 31547b4: feat(utils): add YAML to CHAIN_ID.RULE

  feat(utils): 向 CHAIN_ID.RULE 中增加新常量 YAML

## 1.16.0

### Minor Changes

- 1100dd58c: chore: support react 18

  chore: 支持 React 18

### Patch Changes

- 641592f52: feat(utils): add html-cross-origin to CHAIN_ID

  feat(utils): CHAIN_ID 常量新增 html-cross-origin 值

- 3904b30a5: fix: check apiOnly while has source.entriesDir

  fix: 当配置 source.entriesDir 存在时，apiOnly 检查错误

- e04e6e76a: feat: add media rule name to CHAIN_ID constant

  feat: 在 CHAIN_ID 常量中新增 media rule

- 81c66e4a4: fix: compatibility issues of dev server in iOS 10

  fix: 修复 dev server 代码在 iOS 10 下的兼容性问题

- 2c305b6f5: chore: remove all deploy logic and package
  chore: 删除所有部署相关的逻辑和包

## 1.15.0

### Patch Changes

- 8658a78: chore: remove `@modern-js/plugin-docsite`

  chore: 移除 `@modern-js/plugin-docsite`

- 05d4a4f: chore(utils): add fs-extra to exports fields

  chore(utils): 通过 exports 导出 fs-extra 子路径

- ad05af9: fix: bff.proxy and devServer.proxy types

  fix: 修复 bff.proxy 和 devServer.proxy 类型定义不完整的问题

- 5d53d1c: fix(webpack): failed to format error message in some cases

  fix(webpack): 修复格式化 webpack 错误信息时报错的问题

- 37cd159: feat(webpack): log more detailed error messages

## 1.9.0

### Minor Changes

- 7b9067f: add babel plugin for builder

### Patch Changes

- 79e83ef: chore: merge `@modern-js/plugin-design-token` to `@modern-js/plugin-tailwindcss`

  chore: 合并 `@modern-js/plugin-design-token` 到 `@modern-js/plugin-tailwindcss`

- 22f4dca: chore: move pre-bundled ajv to @modern-js/utils

  chore: 预打包的 ajv 产物移动至 @modern-js/utils 内

## 1.8.1

### Patch Changes

- 4f1889d: fix(utils): revert schema of unbundle plugin

  fix(utils): 恢复 unbundle 插件相关的 schema 配置

## 1.8.0

### Minor Changes

- 4fc801f: chore(utils): remove unused code

  chore(utils): 移除无用代码

### Patch Changes

- c8614b8: fix: using typeof window to determine the browser environment is not accurate
  fix: 使用 typeof windows 判断浏览器环境不够准确

## 1.7.12

### Patch Changes

- dc4676b: chore(webpack): refactor webpack config, split modules

## 1.7.11

### Patch Changes

- nothing happen, only bump

## 1.7.10

### Patch Changes

- b82869d: export ExecaError type

## 1.7.9

### Patch Changes

- a90bc96: perf(babel): skip babel-plugin-import if package not installed

## 1.7.8

### Patch Changes

- 63c354ad5: fix normalizeToPosixPath utils function args would be null
- 073e9ad78: feat(webpack): improve utils of tools.webpack
- f4a7d49e1: fix: applyOptionsChain argument type

## 1.7.7

### Patch Changes

- 9377d2d9d: feat: support addPlugins util in tools.postcss
- 8c9ad1749: feat(babel-preset-base): prebundle babel plugins

## 1.7.6

### Patch Changes

- 6451a098: fix: cyclic dependencies of @modern-js/core and @moden-js/webpack
- d5a2cfd8: fix(utils): isModernjsMonorepo should return false if there is no package.json
- 437367c6: fix(server): hmr not working when using proxy

## 1.7.5

### Patch Changes

- 33de0f7ec: fix type export

## 1.7.4

### Patch Changes

- b8cfc42cd: feat: prebundle tsconfig-paths and nanoid
- 804a5bb8a: fix(utils): isPnpmWorkspaces not work

## 1.7.3

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- 6ae4a34ae: feat: prebundle all postcss plugins
- b80229c79: use json5 instead typescript
- 948cc4436: fix(utils): fix missing browserslist exports

## 1.7.2

### Patch Changes

- cd7346b0d: fix some peer dependencies problem & change shell log
- 69a728375: fix: remove exports.jsnext:source after publish

## 1.7.0

### Minor Changes

- 0ee4bb4e: feat: prebundle webpack loaders and plugins

### Patch Changes

- 6fa74d5f: add internal metrics and logger

## 1.6.0

### Minor Changes

- 0b26b93b: feat: prebundle all dependencies of @modern-js/core

### Patch Changes

- 2d155c4c: feat(utils): prebundle minimist
- 123e432d: use treeshaking product for ssr bundle
- e5a9b26d: fix: prebundled globbdy type
- 123e432d: uglify ssr bundle for treeshaking
- f9f66ef9: add 'slash' module
- 592edabc: feat: prebundle url-join,mime-types,json5,fast-glob,globby,ora,inquirer
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- 3578913e: fix: export ssrHelpers from subpath
- 1c3beab3: fix: skip prebundle caniuse-lite

## 1.5.0

### Minor Changes

- 3bf4f8b0: feat: support start api server only

### Patch Changes

- b8599d09: fix: failed to generate webpack cache
- 60f7d8bf: feat: add tests dir to npmignore

## 1.4.1

### Patch Changes

- 6800be3b: feat: move storage from plugin-ssr to utils

## 1.4.0

### Minor Changes

- 77ff9754: feat: prebundle some deps (chalk, filesize, import-lazy, strip-ansi)
- d2d1d6b2: feat: support server config

### Patch Changes

- 07a4887e: feat: prebundle commander and signale to @modern-js/utils
- ea2ae711: feat: prebundle dependencies, reduce install size
- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- d2d1d6b2: feat: add prepare hook

## 1.3.7

### Patch Changes

- 132f7b53: feat: move config declarations to @modern-js/core

## 1.3.6

### Patch Changes

- c2046f37: fix: plugin unbundle schema define

## 1.3.5

### Patch Changes

- 5bf5868d: fix: isObject should return false when input is null

## 1.3.4

### Patch Changes

- db43dce6: expose plugin-unbundle configs

## 1.3.3

### Patch Changes

- 4c792f68: feat(plugin-garfish): Sub-applications automatically increment basename
  feat(plugin-garfish): export common generate code function
  fix(plugin-garfish): modify plugin-garfish schema config
- a7f42f48: new user config for plugin-unbundle

## 1.3.2

### Patch Changes

- deeaa602: support svg/proxy/multi-version in unbundled

## 1.3.1

### Patch Changes

- 78279953: compiler entry bug fix and dev build console
- 4d72edea: support dev compiler by entry

## 1.3.0

### Minor Changes

- ec4dbffb: feat: support as a pure api service
- bada2879: refactor plugin-garfish:
  - change @modern-js/plugin-micro-frontend => @modern-js/plugin-garfish
  - remove disableCustomerRouter logic
  - adding unit test
  - fix plugin-garfish type error

### Patch Changes

- d099e5c5: fix error when modify modern.config.js
- 24f616ca: feat: support custom meta info
- bd819a8d: feat: add wait function

## 1.2.2

### Patch Changes

- 83166714: change .npmignore

## 1.2.1

### Patch Changes

- 823809c6: fix: remove plugin-polyfill from app-tools

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 2da09c69: Add "typescript" to the dependency list
- c3d46ee4: fix: test config invalid

## 1.1.6

### Patch Changes

- b7fb82ec: fix: get package manager function

## 1.1.5

### Patch Changes

- ca7dcb32: change watch logic

## 1.1.4

### Patch Changes

- d927bc83: update plugins list
- d73ff455: support multi process product
- 9c1ab865: fix: filter invalid ts paths
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product

## 1.1.3

### Patch Changes

- 085a6a58: refactor server plugin
- 085a6a58: refactor server plugin
- 085a6a58: refactor server conifg
- d280ea33: chore: runtime exports can choose to generate d.ts file
- 085a6a58: support server runtime
- 085a6a58: feat: refactor server plugin

## 1.1.2

### Patch Changes

- 0fa83663: support more .env files
- f594fbc8: fix apple icon and favicon support

## 1.1.1

### Patch Changes

- c0fc0700: feat: support deploy plugin

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

## 1.0.0

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.23

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.22

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.21

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.20

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.19

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.18

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.17

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- fix: #118 #104

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial

## 1.0.0-rc.3

### Patch Changes

- feat: initial
