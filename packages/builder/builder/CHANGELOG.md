# @modern-js/builder

## 2.25.0

### Patch Changes

- Updated dependencies [5732c6a]
  - @modern-js/utils@2.25.0
  - @modern-js/builder-shared@2.25.0

## 2.24.0

### Patch Changes

- ef041c0: chore(builder): reuse externals plugin

  chore(builder): 复用 externals 插件

- Updated dependencies [c882fbd]
- Updated dependencies [ef041c0]
- Updated dependencies [4a82c3b]
  - @modern-js/utils@2.24.0
  - @modern-js/builder-shared@2.24.0

## 2.23.1

### Patch Changes

- 20c85bb: feat(rspack-provider): support performance.removeMomentLocale in rspack

  feat(rspack-provider): 在使用 rspack 构建时支持 performance.removeMomentLocale 配置项

- 5772927: feat(rspack-provider): support import .wasm assets

  feat(rspack-provider): 支持引用 .wasm 资源

- 8f2cab0: feat(builder): support using new URL to handle wasm assets

  feat(builder): 支持通过 new URL 来处理 wasm 资源

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [5772927]
- Updated dependencies [811ccd4]
- Updated dependencies [5a3eeff]
- Updated dependencies [4d4dca0]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1
  - @modern-js/builder-shared@2.23.1

## 2.23.0

### Patch Changes

- 9b270b6: feat(builder): extend rules of splitByExperience
  feat(builder): 拓展 splitByExperience 内部规则
- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- 692cc0e: fix(builder): assetsRetry.crossOrigin default to html.crossorigin

  fix(builder): assetsRetry.crossOrigin 默认值与 html.crossorigin 保持一致

- a82d6f7: fix(builder): single-vendor chunkSplit not work as expected

  fix(builder): single-vendor 拆包规则未按照预期生效

- Updated dependencies [15eac36]
- Updated dependencies [d4e85c1]
- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [6dec7c2]
- Updated dependencies [c3216b5]
- Updated dependencies [f14f920]
- Updated dependencies [692cc0e]
- Updated dependencies [38eccef]
- Updated dependencies [f91c557]
- Updated dependencies [a82d6f7]
  - @modern-js/builder-shared@2.23.0
  - @modern-js/utils@2.23.0

## 2.22.1

### Patch Changes

- a470c04: chore(builder): reuse rem plugin between rspack and webpack provider

  chore(builder): 在 rspack 和 webpack provider 间复用 rem 插件

- bd4b150: feat(builder): add builder.serve method

  feat(builder): 新增 builder.serve 方法

- d4045ed: fix(builder): print https URLs when devServer.https is true

  fix(builder): 当 devServer.https 为 true 时，输出 https 的 URLs

- Updated dependencies [e2848a2]
- Updated dependencies [a470c04]
- Updated dependencies [95ffa6b]
- Updated dependencies [12d54ae]
- Updated dependencies [bd4b150]
- Updated dependencies [dd36311]
- Updated dependencies [d4045ed]
- Updated dependencies [8bd9981]
- Updated dependencies [1f02cd2]
- Updated dependencies [cfcf003]
- Updated dependencies [15181be]
  - @modern-js/utils@2.22.1
  - @modern-js/builder-shared@2.22.1

## 2.22.0

### Patch Changes

- 9c3c231: feat(deps): bump @svgr/webpack from v6 to v8

  feat(deps): 将 @svgr/webpack 从 v6 升级到 v8

- 850cde6: feat(builder): add arco config to transformImport by default

  feat(builder): 默认增加 arco 的 transformImport 配置

- ae3fcc2: fix(builder): failed to configure browserslist when target is web-worker

  fix(builder): 修复 target 为 web-worker 时无法配置 browserslist 的问题

- Updated dependencies [3d48836]
- Updated dependencies [5050e8e]
- Updated dependencies [850cde6]
  - @modern-js/builder-shared@2.22.0
  - @modern-js/utils@2.22.0

## 2.21.1

### Patch Changes

- Updated dependencies [19b3b64]
  - @modern-js/builder-shared@2.21.1
  - @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- 863f8df: feat(rspack-provider): support security.checkSyntax in Rspack

  feat(rspack-provider): 在使用 Rspack 构建时支持 security.checkSyntax 配置项

- 55d37e9: fix(builder): should not print file size of LICENSE.text

  fix(builder): 打印文件体积时忽略 LICENSE.text

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 441a579: feat(builder): support output.disableTsChecker in Rspack

  feat(builder): 在使用 Rspack 构建时支持 output.disableTsChecker 配置项

- 43b4e83: feat: support security.nonce for add nonce attribute on script tag
  feat: 支持 security.nonce 配置，为 script 标签添加 nonce 属性
- ad78387: chore(deps): bump babel-related dependencies to latest version

  chore(deps): 升级 babel 相关依赖到最新版本

- Updated dependencies [7d2972e]
- Updated dependencies [863f8df]
- Updated dependencies [e81eeaf]
- Updated dependencies [26dcf3a]
- Updated dependencies [1ef03dc]
- Updated dependencies [056627f]
- Updated dependencies [4274510]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/builder-shared@2.21.0
  - @modern-js/utils@2.21.0

## 2.20.0

### Patch Changes

- 6b9d90a: chore: remove @babel/runtime. add @swc/helper and enable `externalHelper` config.
  chore: 移除 @babel/runtime 依赖. 增加 @swc/helpers 依赖并且开启 `externalHelpers` 配置
- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
  - @modern-js/builder-shared@2.20.0
  - @modern-js/utils@2.20.0

## 2.19.1

### Patch Changes

- afb735f: fix(builder): failed to print file size in some cases

  fix(builder): 修复部分情况下输出产物体积失败的问题

- Updated dependencies [afb735f]
  - @modern-js/builder-shared@2.19.1
  - @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- Updated dependencies [1134fe2]
  - @modern-js/builder-shared@2.19.0
  - @modern-js/utils@2.19.0

## 2.18.1

### Patch Changes

- abf8c6d: perf(builder): optimize stats.toJson performance

  perf(builder): 优化 stats.toJson 性能

- 010b67e: fix(builder): incorrect dynamicImportMode when target is web-worker

  fix(builder): 修复 target 为 web-worker 时 dynamicImportMode 错误的问题

- Updated dependencies [9b0b7ef]
  - @modern-js/builder-shared@2.18.1
  - @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- @modern-js/builder-shared@2.18.0
- @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/builder-shared@2.17.1
- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/builder-shared@2.17.0
- @modern-js/utils@2.17.0

## 2.16.0

### Patch Changes

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- fb19f48: feat(builder): add output.disableSvgr configuration item

  feat(builder): 新增 output.disableSvgr 配置项

- Updated dependencies [fe92de6]
- Updated dependencies [091986a]
- Updated dependencies [5954330]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
- Updated dependencies [e4e0e01]
  - @modern-js/builder-shared@2.16.0
  - @modern-js/utils@2.16.0

## 2.15.0

### Minor Changes

- 3e5e790: feat(transformImport): support disable default transform import, add more test of transformImport

  feat(transformImport): 支持关闭默认的 transform import，增加更多 transformImport 测试

### Patch Changes

- Updated dependencies [3e5e790]
  - @modern-js/builder-shared@2.15.0
  - @modern-js/utils@2.15.0

## 2.14.0

### Patch Changes

- Updated dependencies [b46fbcb]
- Updated dependencies [4779152]
- Updated dependencies [fefd1c5]
- Updated dependencies [8a3c693]
- Updated dependencies [9321bef]
- Updated dependencies [9b45c58]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [864d55e]
- Updated dependencies [b965df2]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/builder-shared@2.14.0
  - @modern-js/utils@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/builder-shared@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- 28583e8: feat(builder): add assetsRetry.inlineScript config

  feat(builder): 新增 assetsRetry.inlineScript 配置项

- Updated dependencies [18cd03f]
- Updated dependencies [28583e8]
  - @modern-js/builder-shared@2.13.3
  - @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- @modern-js/builder-shared@2.13.2
- @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/builder-shared@2.13.1
- @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- 1feacdc: feat(builder): support using RegExp to inline part of chunks

  feat(builder): 支持通过正则来内联部分资源

- 348306d: feat(builder): add html.scriptLoading config

  feat(builder): 新增 html.scriptLoading 配置

- 9c0572e: chore(builder): support get builder/shared compiled path in provider getCompiledPath api

  chore(builder): 支持通过 provider getCompiledPath api 获取 builder/shared 中预打包依赖路径

- Updated dependencies [1feacdc]
- Updated dependencies [384406c]
- Updated dependencies [c89de05]
- Updated dependencies [348306d]
- Updated dependencies [384e393]
- Updated dependencies [9c0572e]
  - @modern-js/builder-shared@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
- Updated dependencies [fef3394]
  - @modern-js/utils@2.12.0
  - @modern-js/builder-shared@2.12.0

## 2.11.0

### Patch Changes

- cfb058f: fix(builder): remove duplicated babel-plugin-import

  fix(builder): 移除重复注册的 babel-plugin-import

- 55b07fd: feat(builder): support output.assetsRetry in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.assetsRetry 配置能力

- 8b90c79: fix(builder): should preserve viewBox when minify svg

  fix(builder): 修复压缩 svg 导致 viewBox 丢失的问题

- 3171c9d: feat(builder): print total file size after build

  feat(builder): 构建后输出文件体积的总和

- cd1040f: feat: use generated default config objects instead of global objects
  feat: 默认配置项使用动态生成替代全局对象
- b71cef1: feat(builder): support setting forceSplitting to be an object

  feat(builder): 支持将 forceSplitting 设置为一个对象

- Updated dependencies [adcedad]
- Updated dependencies [cfb058f]
- Updated dependencies [a9c6083]
- Updated dependencies [55b07fd]
- Updated dependencies [0bd018b]
- Updated dependencies [8b90c79]
- Updated dependencies [a8c08c3]
- Updated dependencies [3aa318d]
- Updated dependencies [5d624fd]
- Updated dependencies [e2466a1]
- Updated dependencies [53b0a63]
- Updated dependencies [02bb383]
- Updated dependencies [381a3b9]
- Updated dependencies [7a60f10]
- Updated dependencies [cd1040f]
- Updated dependencies [e262a99]
- Updated dependencies [b71cef1]
- Updated dependencies [274b2e5]
- Updated dependencies [b9e1c54]
  - @modern-js/builder-shared@2.11.0
  - @modern-js/utils@2.11.0

## 2.10.0

### Patch Changes

- Updated dependencies [a8db932]
- Updated dependencies [92d247f]
- Updated dependencies [0da32d0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/builder-shared@2.10.0
  - @modern-js/utils@2.10.0

## 2.9.0

### Patch Changes

- f31a254d78: feat: improve vendor split chunk rule
  feat: 优化针对第三方库的拆包策略
- 1f047183c3: feat: enable svgo to avoid ID conflicts
  feat: 启用 svgo 以避免 ID 冲突
- da66232feb: fix: asset url using incorrect path seperator in windows

  fix: 修复 windows 中 asset url 使用错误的路径分隔符

  - @modern-js/builder-shared@2.9.0
  - @modern-js/utils@2.9.0

## 2.8.0

### Patch Changes

- bd369a89a4: fix(builder): failed to set CDN URL via html.tags

  fix(builder): 修复 html.tags 无法设置 CDN URL 的问题

- Updated dependencies [bd369a89a4]
- Updated dependencies [1104a9f18b]
- Updated dependencies [2c1151271d]
- Updated dependencies [481461a61d]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/builder-shared@2.8.0
  - @modern-js/utils@2.8.0

## 2.7.0

### Minor Changes

- dfece9dc1c: fix(builder): vendor library chunks include sources
  fix(builder): 用户源码被划分到第三方库所在 Chunk

### Patch Changes

- Updated dependencies [206c806efa]
- Updated dependencies [0f15fc597c]
- Updated dependencies [5f899af53a]
- Updated dependencies [dcad887024]
- Updated dependencies [a4672f7c16]
- Updated dependencies [ebe0d2dd6e]
- Updated dependencies [7fff9020e1]
- Updated dependencies [84bfb439b8]
  - @modern-js/builder-shared@2.7.0
  - @modern-js/utils@2.7.0

## 2.6.0

### Patch Changes

- 107f674: feat(builder): add dev.beforeStartUrl config

  feat(builder): 新增 dev.beforeStartUrl 配置项

- 0fe658a: feat(builder): support passing URL to html.favicon

  feat(builder): 支持在 html.favicon 中直接传入 URL

- Updated dependencies [b92d6db]
- Updated dependencies [e1f799e]
- Updated dependencies [107f674]
- Updated dependencies [7915ab3]
- Updated dependencies [03d7f7d]
- Updated dependencies [fae9d1b]
- Updated dependencies [0fe658a]
- Updated dependencies [62930b9]
  - @modern-js/builder-shared@2.6.0
  - @modern-js/utils@2.6.0

## 2.5.0

### Patch Changes

- 442204a: fix(builder): should not open startUrl multiple times

  fix(builder): 修复 startUrl 被重复打开的问题

- 30614fa: chore: modify package.json entry fields and build config
  chore: 更改 package.json entry 字段以及构建配置
- c4c10e7: refactor: refactor rules for static assets processing with rule.oneOf, reuse svg/font/image/media plugin

  refactor: 使用 oneOf 重构静态资源处理规则 & 复用 svg / font / media / img 插件

- Updated dependencies [58a9918]
- Updated dependencies [30614fa]
- Updated dependencies [c4c10e7]
- Updated dependencies [1b0ce87]
- Updated dependencies [11c053b]
- Updated dependencies [28e7dc6]
- Updated dependencies [40230b3]
  - @modern-js/builder-shared@2.5.0
  - @modern-js/utils@2.5.0

## 2.4.0

### Patch Changes

- 014d06b: feat: reuse bundleAnalyzer plugin, support performance.bundleAnalyze config in rspack-provider

  feat: 复用 bundleAnalyzer 插件，在 rspack-provider 中支持 performance.bundleAnalyze 配置项

- 91db54e: feat: use 'devtool: source-map' for ssr webpack bundle
  feat: 使用 'devtool: source-map' 作为 ssr 构建时的默认配置
- Updated dependencies [6f83037]
- Updated dependencies [014d06b]
- Updated dependencies [98a2733]
- Updated dependencies [a5572b8]
- Updated dependencies [a914be8]
- Updated dependencies [8c2db5f]
  - @modern-js/builder-shared@2.4.0
  - @modern-js/utils@2.4.0

## 2.3.0

### Minor Changes

- f9a26fe: fix(@modern-js/builder-shared): openBrowser add openChrome.applescript script

  fix(@modern-js/builder-shared): openBrowser 添加 openChrome.applescript 脚本

### Patch Changes

- 7cd8185: chore: reuse splitChunks plugin between rspack-provider and webpack-provider

  chore: 在 rspack-provider 和 webpack-provider 间复用 splitChunks plugin

- Updated dependencies [fd5a3ed]
- Updated dependencies [67ba34a]
- Updated dependencies [2ad9fdf]
- Updated dependencies [f9a26fe]
- Updated dependencies [6ca1c0b]
- Updated dependencies [89b6739]
  - @modern-js/utils@2.3.0
  - @modern-js/builder-shared@2.3.0

## 2.2.0

### Patch Changes

- d82b621: feat(builder): support port placeholder in dev.startUrl config

  feat(builder): 支持在 dev.startUrl 配置项中使用端口号占位符

- 16bdc0a: chore: adjust builder plugin name

  chore: 调整 builder 插件命名格式

- Updated dependencies [f2f8a83]
- Updated dependencies [49eff0c]
  - @modern-js/builder-shared@2.2.0
  - @modern-js/utils@2.2.0

## 2.1.0

### Patch Changes

- Updated dependencies [837620c]
- Updated dependencies [3ad26c2]
- Updated dependencies [5b54418]
- Updated dependencies [ccbac43]
- Updated dependencies [8a9482c]
- Updated dependencies [679296d]
  - @modern-js/utils@2.1.0
  - @modern-js/builder-shared@2.1.0

## 2.0.0

### Major Changes

Initial Release
