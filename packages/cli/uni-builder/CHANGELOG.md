# @modern-js/uni-builder

## 2.60.2

### Patch Changes

- ff24d56: feat(deps): bump rsbuild 1.0.6 & rspack 1.0.7
- 3a07a59: feat(deps): bump Rsbuild v1.0.7
- Updated dependencies [8a709bc]
  - @modern-js/utils@2.60.2
  - @modern-js/babel-preset@2.60.2

## 2.60.1

### Patch Changes

- 4cfe425: fix: html minify error when tools.htmlPlugin false
- edb1fea: feat: support config dev.liveReload
  - @modern-js/babel-preset@2.60.1
  - @modern-js/utils@2.60.1

## 2.60.0

### Patch Changes

- a20b0d2: feat: bump Rsbuild 1.0.x stable
- 4f19e98: chore: rename serviceWorker environment name to workerSSR
- 05f14fe: feat: add warn when transformLodash and transformImport for lodash library both exist

  feat: 同时使用 source.transformImport 和 performance.transformLodash 优化 lodash 导入时添加警告信息

  - @modern-js/babel-preset@2.60.0
  - @modern-js/utils@2.60.0

## 2.59.0

### Patch Changes

- a43813d: feat: support for security.sri when using Rspack
- 59ba402: feat(deps): bump Rsbuild 1.0.1-rc.3
- 0363aec: chore(deps): bump Rsbuild 1.0.1-rc.4
- d9a48a8: feat: bump Rsbuild 1.0-rc & Rspack 1.0.0
- 661b6d5: fix: remove lib-lodash from experience chunks
- afdca3e: fix: serviceWorker default config
- e2a79bf: fix: dev.setupMiddlewares not work

  fix: 修复 dev.setupMiddlewares 不生效的问题

  - @modern-js/utils@2.59.0
  - @modern-js/babel-preset@2.59.0

## 2.58.3

### Patch Changes

- @modern-js/babel-preset@2.58.3
- @modern-js/utils@2.58.3

## 2.58.2

### Patch Changes

- Updated dependencies [a1a9373]
  - @modern-js/utils@2.58.2
  - @modern-js/babel-preset@2.58.2

## 2.58.1

### Patch Changes

- bf8810a: fix: should not minify html when disableMinimize in webpack mode

  fix: webpack 模式下，当配置 disableMinimize 时不开启 html 压缩

  - @modern-js/utils@2.58.1
  - @modern-js/babel-preset@2.58.1

## 2.58.0

### Minor Changes

- 58f2868: feat: bump rsbuild 1.0.1-beta.9

### Patch Changes

- @modern-js/babel-preset@2.58.0
- @modern-js/utils@2.58.0

## 2.57.1

### Patch Changes

- @modern-js/babel-preset@2.57.1
- @modern-js/utils@2.57.1

## 2.57.0

### Patch Changes

- Updated dependencies [2515b00]
  - @modern-js/utils@2.57.0
  - @modern-js/babel-preset@2.57.0

## 2.56.2

### Patch Changes

- @modern-js/babel-preset@2.56.2
- @modern-js/utils@2.56.2

## 2.56.1

### Patch Changes

- 4c0486a: fix: match unexpected environment resources when artifact with the same name in different environments

  fix: 当存在同名产物时匹配到不符合预期的 environment 资源

  - @modern-js/prod-server@2.56.1
  - @modern-js/server@2.56.1
  - @modern-js/babel-preset@2.56.1
  - @modern-js/utils@2.56.1

## 2.56.0

### Minor Changes

- b912ca5: refactor: bump rsbuild 1.0.0-alpha and use Rsbuild environment config

### Patch Changes

- Updated dependencies [bedbbb3]
- Updated dependencies [53419a5]
- Updated dependencies [119b9e1]
- Updated dependencies [d1eb8dc]
  - @modern-js/prod-server@2.56.0
  - @modern-js/babel-preset@2.56.0
  - @modern-js/server@2.56.0
  - @modern-js/utils@2.56.0

## 2.55.0

### Patch Changes

- a0ac594: chore: decouple with rsbuild/shared
- Updated dependencies [35cddd7]
- Updated dependencies [bbcf55a]
  - @modern-js/prod-server@2.55.0
  - @modern-js/utils@2.55.0
  - @modern-js/server@2.55.0

## 2.54.6

### Patch Changes

- Updated dependencies [35e119a]
  - @modern-js/server@2.54.6
  - @modern-js/prod-server@2.54.6
  - @modern-js/utils@2.54.6

## 2.54.5

### Patch Changes

- Updated dependencies [5525a23]
  - @modern-js/prod-server@2.54.5
  - @modern-js/server@2.54.5
  - @modern-js/utils@2.54.5

## 2.54.4

### Patch Changes

- @modern-js/prod-server@2.54.4
- @modern-js/server@2.54.4
- @modern-js/utils@2.54.4

## 2.54.3

### Patch Changes

- Updated dependencies [b50d7ec]
- Updated dependencies [c5644c9]
  - @modern-js/prod-server@2.54.3
  - @modern-js/server@2.54.3
  - @modern-js/utils@2.54.3

## 2.54.2

### Patch Changes

- @modern-js/prod-server@2.54.2
- @modern-js/server@2.54.2
- @modern-js/utils@2.54.2

## 2.54.1

### Patch Changes

- @modern-js/prod-server@2.54.1
- @modern-js/server@2.54.1
- @modern-js/utils@2.54.1

## 2.54.0

### Minor Changes

- a8d8f0c: feat: support new server plugin & discard server plugin some hooks
  feat: 支持新 server plugin & 减少 server plugin 钩子

### Patch Changes

- da84b0a: chore(deps): bump rsbuild to 0.7.7
- Updated dependencies [15a090c]
- Updated dependencies [a8d8f0c]
- Updated dependencies [09798ac]
  - @modern-js/utils@2.54.0
  - @modern-js/prod-server@2.54.0
  - @modern-js/server@2.54.0

## 2.53.0

### Patch Changes

- @modern-js/prod-server@2.53.0
- @modern-js/server@2.53.0
- @modern-js/utils@2.53.0

## 2.52.0

### Patch Changes

- b520609: chore(deps): bump Rsbuild v0.7.3

  chore(deps): 升级 Rsbuild v0.7.3

  - @modern-js/prod-server@2.52.0
  - @modern-js/server@2.52.0
  - @modern-js/utils@2.52.0

## 2.51.0

### Minor Changes

- e8d41fe: feat: bump rsbuild to 0.7.x and use CssExtractRspackPlugin to extract CSS

### Patch Changes

- @modern-js/prod-server@2.51.0
- @modern-js/server@2.51.0
- @modern-js/utils@2.51.0

## 2.50.0

### Patch Changes

- @modern-js/prod-server@2.50.0
- @modern-js/server@2.50.0
- @modern-js/utils@2.50.0

## 2.49.4

### Patch Changes

- Updated dependencies [6e12e9f]
  - @modern-js/prod-server@2.49.4
  - @modern-js/server@2.49.4
  - @modern-js/utils@2.49.4

## 2.49.3

### Patch Changes

- 496703a: fix: uni-builder should depedency prod-server correctly
  fix: uni-builder 需要正确依赖 prod-server
- 3114955: chore(uni-builder): use rspack-manifest-plugin stable version
- Updated dependencies [72b864d]
  - @modern-js/server@2.49.3
  - @modern-js/prod-server@2.49.3
  - @modern-js/utils@2.49.3

## 2.49.2

### Patch Changes

- @modern-js/server@2.49.2
- @modern-js/utils@2.49.2

## 2.49.1

### Patch Changes

- bf82b23: chore(uni-builder): reuse rspack-manifest-plugin in webpack mode

  chore(uni-builder): 在 webpack 模式下复用 rspack-manifest-plugin

- b70ea93: chore(deps): bump rsbuild to 0.6.6
- 6d5203e: feat: support dev.client configuration

  feat: 支持 dev.client 配置项

- Updated dependencies [b89879e]
  - @modern-js/server@2.49.1
  - @modern-js/utils@2.49.1

## 2.49.0

### Minor Changes

- e8c8c5d: refactor: refactor server
  refactor: 重构 server

### Patch Changes

- e891617: fix(uni-builder): modernjs should extend "ua" type in output.polyfill
- 772d1f6: chore(deps): bump rsbuild to [0.6.x](https://github.com/web-infra-dev/rsbuild/releases/tag/v0.6.0)

  chore(deps): 升级 rsbuild 到 [0.6.x](https://github.com/web-infra-dev/rsbuild/releases/tag/v0.6.0)

- Updated dependencies [e8c8c5d]
- Updated dependencies [805e021]
  - @modern-js/server@2.49.0
  - @modern-js/utils@2.49.0

## 2.48.6

### Patch Changes

- 06ed962: chore(deps): bump rsbuild to [0.6.1](https://github.com/web-infra-dev/rsbuild/releases/tag/v0.6.1)

  chore(deps): 升级 rsbuild 到 [0.6.1](https://github.com/web-infra-dev/rsbuild/releases/tag/v0.6.1)

  - @modern-js/server@2.48.6
  - @modern-js/utils@2.48.6

## 2.48.5

### Patch Changes

- Updated dependencies [4ca9f4c]
  - @modern-js/utils@2.48.5
  - @modern-js/server@2.48.5

## 2.48.4

### Patch Changes

- Updated dependencies [7d2d433]
  - @modern-js/utils@2.48.4
  - @modern-js/server@2.48.4

## 2.48.3

### Patch Changes

- 879f90b: chore(deps): bump rsbuild 0.5.x

  chore(deps): 升级 rsbuild 到 0.5.x

- 18e6249: chore(server): set devServer.compress config value in app-tools

  chore(server): 在 app-tools 中设置 ssr 场景下 devServer compress 配置的值

- Updated dependencies [18e6249]
  - @modern-js/server@2.48.3
  - @modern-js/utils@2.48.3

## 2.48.2

### Patch Changes

- 9e7115f: feat(server): support modify Rsbuild server config in Rsbuild modifyRsbuildConfig hook

  feat(server): 支持在 Rsbuild modifyRsbuildConfig hook 中修改 Rsbuild server 相关配置

- Updated dependencies [9e7115f]
  - @modern-js/server@2.48.2
  - @modern-js/utils@2.48.2

## 2.48.1

### Patch Changes

- 9835dbf: feat(uni-builder): bump rsbuild 0.4.11 and support modify rspack builtin:swc-loadder config by tools.swc

  feat(uni-builder): rsbuild 版本升级到 0.4.11，并支持通过 tools.swc 修改 rspack builtin:swc-loadder 配置

- 77209fe: fix(uni-builder): allow tools.postcss to override the plugins

  fix(uni-builder): 允许通过 tools.postcss 覆盖内置 plugins

- fc93013: fix(uni-builder): missing postcss peer dependency

  fix(uni-builder): 缺少 postcss peer dependency

- 788b3be: fix(uni-builder): should not apply babel-loader in modern.js basic app when use rspack build

  fix(uni-builder): 在 modern.js 基础 demo 中使用 rspack 构建时不应该用到 babel-loader

- 0d0a886: fix(uni-builder): html.templateParametersByEntries should merge with default value

  fix(uni-builder): html.templateParametersByEntries 返回值应与默认值合并

- 02060c5: fix(uni-builder): splitChunks.overrides not effective for inner cacheGroups

  fix(uni-builder): splitChunks.overrides 配置项对内置 cacheGroups 无效

- Updated dependencies [8942b90]
- Updated dependencies [24b2ec1]
- Updated dependencies [ce426f7]
  - @modern-js/utils@2.48.1
  - @modern-js/server@2.48.1

## 2.48.0

### Patch Changes

- ecaf916: feat(deps): bump Rsbuild v0.4.8

  feat(deps): 升级 Rsbuild v0.4.8

- Updated dependencies [0b44ddb]
- Updated dependencies [c323a23]
  - @modern-js/prod-server@2.48.0
  - @modern-js/utils@2.48.0
  - @modern-js/server@2.48.0

## 2.47.1

### Patch Changes

- @modern-js/prod-server@2.47.1
- @modern-js/server@2.47.1
- @modern-js/utils@2.47.1

## 2.47.0

### Patch Changes

- 0448ebd: fix(uni-builder): deepmerge cause plugin apply undefined

  fix(uni-builder): deepmerge 导致 webpack apply 方法丢失

- eec5792: fix(uni-builder): apply babel preset-react when using ts-loader

  fix(uni-builder): 使用 ts-loader 时开启 babel preset-react

- b79abcf: fix(uni-builder): styled-components not works when use webpack swc-plugin

  fix(uni-builder): 修复在使用 webpack swc 插件时 styled-components 不生效的问题

- 244745f: fix(uni-builder): repeatedly insert babel plugin when using tsLoader in some edge case

  fix(uni-builder): 修复在一些边界场景下使用 tsLoader 时会重复添加 babel plugin 的问题

- fd2d496: chore(deps): bump rsbuild 0.4.3

  chore(deps): 升级 rsbuild 到 0.4.3

- ed13533: fix(uni-builder): missing css sourcemap when dev

  fix(uni-builder): dev 构建时缺失 css sourcemap

- b481d30: chore(uni-builder): set babel-post plugin order to 'post'

  chore(uni-builder): 将 babel-post 顺序调整为 'post'

- Updated dependencies [b68c12a]
- Updated dependencies [a5386ab]
- Updated dependencies [a9a3626]
- Updated dependencies [01b75e6]
  - @modern-js/prod-server@2.47.0
  - @modern-js/utils@2.47.0
  - @modern-js/server@2.47.0

## 2.46.1

### Patch Changes

- 26cdc77: fix(uni-builder): should print https url when enable dev.https

  fix(uni-builder): 应该打印 https url 当开启 dev.https 时

- 875d5dd: fix(uni-builder): tools.devServer client options not works

  fix(uni-builder): 修复 tools.devServer client 配置项不生效问题

- 1e81b5a: fix(uni-builder): disable default publicDir

  fix(uni-builder): 默认禁用 publicDir

  - @modern-js/prod-server@2.46.1
  - @modern-js/server@2.46.1
  - @modern-js/utils@2.46.1

## 2.46.0

### Minor Changes

- 4699e22: feat: bump Rsbuild 0.3.3 and Rspack 0.5.0

  feat: 升级 Rsbuild 0.3.3 和 Rspack 0.5.0

### Patch Changes

- f6b0e59: feat(uni-builder): support passing source build options

  feat(uni-builder): 支持传入 source build 配置项

- cac5e16: fix(uni-builder): make the plugins type looser to avoid type mismatch

  fix(uni-builder): 使用更松散的 plugins 类型来避免 type 不匹配的问题

- 4699e22: chore: explicitly declare Node version of babel target

  chore: 显式声明 babel 的目标 Node 版本

- Updated dependencies [091c7c2]
- Updated dependencies [d833015]
- Updated dependencies [46e6d56]
- Updated dependencies [494b290]
  - @modern-js/prod-server@2.46.0
  - @modern-js/server@2.46.0
  - @modern-js/utils@2.46.0

## 2.45.0

### Patch Changes

- 783dd96: chore(deps): bump rsbuild to 0.2.15

  chore(deps): 升级 rsbuild 到 0.2.15

- Updated dependencies [f50ad3e]
  - @modern-js/prod-server@2.45.0
  - @modern-js/server@2.45.0
  - @modern-js/utils@2.45.0

## 2.44.0

### Patch Changes

- bfe1347: chore(deps): bump rsbuild to 0.2.8 and use html-webpack-plugin in uni-builder webpack mode

  chore(deps): 升级 rsbuild 到 0.2.8，在 uni-builder webpack 模式下使用 html-webpack-plugin

- Updated dependencies [0ed968c]
- Updated dependencies [2b41e70]
- Updated dependencies [56d7f9a]
  - @modern-js/prod-server@2.44.0
  - @modern-js/server@2.44.0
  - @modern-js/utils@2.44.0

## 2.43.0

### Patch Changes

- 3067256: chore: bump rsbuild to 0.2.7

  chore: 升级 rsbuild 到 0.2.7

- 03a3196: feat(uni-builder): add unified builder for Modern.js

  feat(uni-builder): 添加从原 modern.js builder 到 Rsbuild 的转换层

- 66fca4e: feat(uni-builder): integrate modern server into startDevServer

  feat(uni-builder): 将 modern server 集成到 startDevServer 中

- Updated dependencies [9e749d8]
- Updated dependencies [d959200]
- Updated dependencies [acd3861]
- Updated dependencies [5782aa3]
  - @modern-js/server@2.43.0
  - @modern-js/prod-server@2.43.0
  - @modern-js/utils@2.43.0
