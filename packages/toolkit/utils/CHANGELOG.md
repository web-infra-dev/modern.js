# @modern-js/utils

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
