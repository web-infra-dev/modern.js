# @modern-js/builder-rspack-provider

## 2.30.0

### Patch Changes

- 0ea763e: chore(builder): update rspack to 0.2.11

  chore(builder): 升级 rspack 到 0.2.11

- e6ae836: feat(builder): support performance preload & prefetch configurations

  feat(builder): 支持 performance preload 和 prefetch 配置项

- Updated dependencies [a5ee81a]
- Updated dependencies [883692c]
- Updated dependencies [cc5f49e]
- Updated dependencies [f74064c]
- Updated dependencies [b6ab299]
- Updated dependencies [e6ae836]
- Updated dependencies [7cb7b24]
- Updated dependencies [e94ad94]
  - @modern-js/types@2.30.0
  - @modern-js/server@2.30.0
  - @modern-js/builder-shared@2.30.0
  - @modern-js/utils@2.30.0

## 2.29.0

### Patch Changes

- 1d420ae: feat(builder): support resolve relative asset in SASS files

  feat(builder): 支持处理 SASS 文件的相对资源

- 3e0e1b2: chore(builder): update rspack to 0.2.10

  chore(builder): 升级 rspack 到 0.2.10

- 99052ea: feat(builder): improve error stacks if dev compilation failed

  feat(builder): 优化 dev 编译失败时的错误堆栈格式

- 2ad31da: feat(builder): support performance preconnect/dnsPrefetch configurations

  feat(builder): 支持 performance preconnect/dnsPrefetch 配置项

- Updated dependencies [e6b5355]
- Updated dependencies [93db783]
- Updated dependencies [bd4c354]
- Updated dependencies [cba7675]
- Updated dependencies [99052ea]
- Updated dependencies [d198779]
- Updated dependencies [1d71d2e]
  - @modern-js/utils@2.29.0
  - @modern-js/builder-shared@2.29.0
  - @modern-js/server@2.29.0
  - @modern-js/types@2.29.0

## 2.28.0

### Patch Changes

- 213089e: chore(builder): update rspack to 0.2.9

  chore(builder): 升级 rspack 到 0.2.9

- 362416f: feat(builder): support import Node.js addons when target is node

  feat(builder): 支持在 target 为 node 时引用 Node.js addons

- 9301e46: chore(builder): optimize some error format of zod validation and add joint verification of rspack css related configuration

  chore(builder): 优化 builder schema 校验的部分错误输出格式，并为 rspack 添加 css 相关配置的联合校验

- Updated dependencies [4e3ce96]
- Updated dependencies [6400d98]
- Updated dependencies [6eae1e7]
- Updated dependencies [362416f]
- Updated dependencies [aa0c0c3]
- Updated dependencies [9301e46]
- Updated dependencies [00b58a7]
- Updated dependencies [820bfe9]
  - @modern-js/types@2.28.0
  - @modern-js/builder-shared@2.28.0
  - @modern-js/server@2.28.0
  - @modern-js/utils@2.28.0

## 2.27.0

### Minor Changes

- 3f79dd7: feat(builder): add `source.aliasStrategy` option

  feat(builder): 新增 `source.aliasStrategy` 选项

### Patch Changes

- 645e111: fix(builder): CSS Modules name has a probability of conflict in prod

  fix(builder): 修复 CSS Modules name 在生产环境有极小概率冲突的问题

- 8322a51: chore: migrate packages from tsc to module-lib build

  chore: 将使用 tsc 的包迁移到 module-lib 构建

- 5376a22: chore(builder): update rspack to 0.2.8 and compatible [dev-client change](https://github.com/web-infra-dev/rspack/pull/3731/files)

  chore(builder): 升级 rspack 到 0.2.8 并兼容 [dev-client 变更](https://github.com/web-infra-dev/rspack/pull/3731/files)

- 67d0b0c: fix(builder): failed to disable html via htmlPlugin: false

  fix(builder): 修复通过 htmlPlugin: false 无法禁用 html 的问题

- Updated dependencies [645e111]
- Updated dependencies [91d14b8]
- Updated dependencies [8322a51]
- Updated dependencies [d9080ed]
- Updated dependencies [67d0b0c]
- Updated dependencies [3f79dd7]
- Updated dependencies [6d7104d]
  - @modern-js/builder-shared@2.27.0
  - @modern-js/utils@2.27.0
  - @modern-js/server@2.27.0
  - @modern-js/types@2.27.0

## 2.26.0

### Patch Changes

- 150ddb1: fix(builder-shared): set formatStats fn as sync-fn so that info can print quikly
  fix(builder-shared): 将 formatStats 设置成同步函数使构建信息能够尽快的打印出来
- fac4ee0: fix(builder): enable preferRelative for CSS files by default

  fix(builder): 默认开启 CSS files 的 preferRelative 配置

- cdf5b6b: chore(builder): override rspack.devServer type declare and update doc

  chore(builder): 覆盖 rspack.devServer 类型定义并更新文档

- Updated dependencies [150ddb1]
- Updated dependencies [15ad760]
- Updated dependencies [786c195]
  - @modern-js/builder-shared@2.26.0
  - @modern-js/server@2.26.0
  - @modern-js/types@2.26.0
  - @modern-js/utils@2.26.0

## 2.25.2

### Patch Changes

- f54bb68: chore(rspack-provider): update rspack to 0.2.5

  chore(rspack-provider): 升级 rspack 相关依赖到 0.2.5

- 15a8276: fix(builder): failed to set publicPath function

  fix(builder): 修复设置 publicPath 函数时报错的问题

- 272646c: feat(builder): bump webpack v5.88, support top level await

  feat(builder): 升级 webpack v5.88, 支持 top level await

- Updated dependencies [63d8247]
- Updated dependencies [6651684]
- Updated dependencies [15a8276]
- Updated dependencies [272646c]
- Updated dependencies [358ed24]
  - @modern-js/utils@2.25.2
  - @modern-js/builder-shared@2.25.2
  - @modern-js/server@2.25.2
  - @modern-js/types@2.25.2

## 2.25.1

### Patch Changes

- Updated dependencies [b10045f]
- Updated dependencies [9f78d0c]
  - @modern-js/builder-shared@2.25.1
  - @modern-js/utils@2.25.1
  - @modern-js/server@2.25.1
  - @modern-js/types@2.25.1

## 2.25.0

### Patch Changes

- bafd4aa: chore(rspack-provider): update rspack to 0.2.4

  chore(rspack-provider): 升级 rspack 相关依赖到 0.2.4

- Updated dependencies [2491875]
- Updated dependencies [5732c6a]
  - @modern-js/types@2.25.0
  - @modern-js/utils@2.25.0
  - @modern-js/builder-shared@2.25.0
  - @modern-js/server@2.25.0

## 2.24.0

### Patch Changes

- ef041c0: chore(builder): reuse externals plugin

  chore(builder): 复用 externals 插件

- 4fdd868: feat(rspack-provider): update rspack to v0.2.3

  feat(rspack-provider): 升级 rspack 到 v0.2.3

- Updated dependencies [c882fbd]
- Updated dependencies [8c9923f]
- Updated dependencies [ef041c0]
- Updated dependencies [0424a2d]
- Updated dependencies [4a82c3b]
  - @modern-js/types@2.24.0
  - @modern-js/utils@2.24.0
  - @modern-js/server@2.24.0
  - @modern-js/builder-shared@2.24.0

## 2.23.1

### Patch Changes

- 20c85bb: feat(rspack-provider): support performance.removeMomentLocale in rspack

  feat(rspack-provider): 在使用 rspack 构建时支持 performance.removeMomentLocale 配置项

- 5772927: feat(rspack-provider): support import .wasm assets

  feat(rspack-provider): 支持引用 .wasm 资源

- 4af25d9: fix(builder): remove @modern-js/e2e from peerDependencies

  fix(builder): 移除 @modern-js/e2e peerDependencies

- 4d4dca0: feat(builder): add new plugin.remove option

  feat(builder): 新增 plugin.remove 选项

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [5772927]
- Updated dependencies [811ccd4]
- Updated dependencies [5a3eeff]
- Updated dependencies [4d4dca0]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1
  - @modern-js/builder-shared@2.23.1
  - @modern-js/server@2.23.1
  - @modern-js/types@2.23.1

## 2.23.0

### Patch Changes

- 15eac36: chore(builder): move more default config to shared package

  chore(builder): 移动更多默认 config 到 shared 包

- a912b66: fix(builder): support devMiddleware.writeToDisk in rspack and use webpack-dev-middleware instead of @rspack/dev-middleware

  fix(builder): 在 rspack 中支持 devMiddleware.writeToDisk 配置项，并使用 webpack-dev-middleware 代替 @rspack/dev-middleware

- d4e85c1: fix(rspack-provider): should inject polyfill for web-worker target

  fix(rspack-provider): 修复 web-worker target 未注入 polyfill 的问题

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- f212633: feat(rspack-provider): update rspack to [0.2.2](https://github.com/web-infra-dev/rspack/releases/tag/0.2.2)

  feat(rspack-provider): 升级 rspack 到 [0.2.2](https://github.com/web-infra-dev/rspack/releases/tag/0.2.2) 版本

- 5684381: fix(builder): incorrect importLoaders option for sass/less files

  fix(builder): 修正 importLoaders 对于 sass/less 文件的值

- f14f920: feat(rspack-provider): support disableCssExtract in rspack

  feat(rspack-provider): 在 Rspack 构建时支持 disableCssExtract 能力

- 38eccef: chore(builder): move getPostcssConfig and postcss related pkg to builder-shared

  chore(builder): 将 getPostcssConfig 和 postcss 相关的 pkg 移动到 builder-shared 中

- f91c557: fix(builder): failed to minify css when use style-loader in Rspack

  fix(builder): 修复使用 Rspack + style-loader 时未压缩 CSS 的问题

- Updated dependencies [964c41b]
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
  - @modern-js/e2e@2.23.0
  - @modern-js/builder-shared@2.23.0
  - @modern-js/server@2.23.0
  - @modern-js/types@2.23.0
  - @modern-js/utils@2.23.0

## 2.22.1

### Patch Changes

- a470c04: chore(builder): reuse rem plugin between rspack and webpack provider

  chore(builder): 在 rspack 和 webpack provider 间复用 rem 插件

- bd4b150: feat(builder): add builder.serve method

  feat(builder): 新增 builder.serve 方法

- c739207: feat(builder): support enable CSS Modules for the specified style file by output.cssModules configuration

  feat(builder): 支持通过 output.cssModules 配置项为指定的样式文件启用 CSS Modules

- c465db6: fix(builder): update rspack to 0.2.1 and remove useless config format logic

  fix(builder): 将 Rspack 升级到 0.2.1 并移除无用的配置转换逻辑

- 8bd9981: fix(builder): use postcss-loader instead of @rspack/postcss-loader to fix tailwindcss hmr bug

  fix(builder): 使用 postcss-loader 代替 @rspack/postcss-loader, 来修复 tailwindcss hmr 问题

- Updated dependencies [25b490a]
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
  - @modern-js/types@2.22.1
  - @modern-js/utils@2.22.1
  - @modern-js/builder-shared@2.22.1
  - @modern-js/server@2.22.1
  - @modern-js/e2e@2.22.1

## 2.22.0

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- 4161b09: fix(builder): rule.loader support undefined in rspack

  fix(builder): 使用 rspack 构建时, rule.loader 允许为空

- becfd36: fix(builder): support array in output.externals when use Rspack

  fix(builder): 在使用 Rspack 构建时，output.externals 支持数组

- 02238e6: feat(builder): 使用 Rspack 0601 nightly 版本 (与 0.2.0 版本功能相同)

  feat(builder): adapt and use Rspack 0601 nightly version (Same features as version 0.2.0.)

- Updated dependencies [3d48836]
- Updated dependencies [5050e8e]
- Updated dependencies [850cde6]
  - @modern-js/builder-shared@2.22.0
  - @modern-js/utils@2.22.0
  - @modern-js/server@2.22.0
  - @modern-js/e2e@2.22.0
  - @modern-js/types@2.22.0

## 2.21.1

### Patch Changes

- Updated dependencies [19b3b64]
  - @modern-js/builder-shared@2.21.1
  - @modern-js/server@2.21.1
  - @modern-js/e2e@2.21.1
  - @modern-js/types@2.21.1
  - @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- 7d2972e: fix(builder): output.copy not work in Rspack

  fix(builder): output.copy 在 Rspack 构建时不生效

- 7d2972e: feat(builder): update rspack to 0.1.12

  feat(builder): 升级 rspack 到 0.1.12 版本

- 863f8df: feat(rspack-provider): support security.checkSyntax in Rspack

  feat(rspack-provider): 在使用 Rspack 构建时支持 security.checkSyntax 配置项

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 8a7d4d2: hotfix(rspack-provider): update Rspack and fix upgrade error

  hotfix(rspack-provider): 升级 Rspack 并处理升级问题

- 441a579: feat(builder): support output.disableTsChecker in Rspack

  feat(builder): 在使用 Rspack 构建时支持 output.disableTsChecker 配置项

- 056627f: fix(plugin-sass): pollute the `global.location` object
  fix(plugin-sass): 污染全局对象 `global.location`
- 4274510: fix(builder): failed to disable html via htmlPlugin: false

  fix(builder): 修复通过 htmlPlugin: false 无法禁用 html 的问题

- c90ea5a: feat(builder): support output.enableAssetManifest in Rspack

  feat(builder): 在使用 Rspack 构建时支持 output.enableAssetManifest 配置项

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
- Updated dependencies [8fa8566]
- Updated dependencies [4274510]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/builder-shared@2.21.0
  - @modern-js/utils@2.21.0
  - @modern-js/server@2.21.0
  - @modern-js/e2e@2.21.0
  - @modern-js/types@2.21.0

## 2.20.0

### Patch Changes

- f0ef868: feat(rspack-provider): update rspack to 0.1.11

  feat(rspack-provider): 升级 rspack 相关依赖到 0.1.11

- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
- Updated dependencies [5f055ab]
  - @modern-js/builder-shared@2.20.0
  - @modern-js/utils@2.20.0
  - @modern-js/server@2.20.0
  - @modern-js/types@2.20.0
  - @modern-js/e2e@2.20.0

## 2.19.1

### Patch Changes

- Updated dependencies [afb735f]
  - @modern-js/builder-shared@2.19.1
  - @modern-js/server@2.19.1
  - @modern-js/e2e@2.19.1
  - @modern-js/types@2.19.1
  - @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- Updated dependencies [1134fe2]
  - @modern-js/builder-shared@2.19.0
  - @modern-js/server@2.19.0
  - @modern-js/utils@2.19.0
  - @modern-js/e2e@2.19.0
  - @modern-js/types@2.19.0

## 2.18.1

### Patch Changes

- 9b0b7ef: feat(rspack-provider): support tools.pug configuration when Rspack build

  feat(rspack-provider): 在使用 Rspack 构建时支持 tools.pug 配置项

- abf8c6d: perf(builder): optimize stats.toJson performance

  perf(builder): 优化 stats.toJson 性能

- a6ac01a: feat(rspack-provider): support legalComments `linked` and `none` configuration items when building with Rspack

  feat(rspack-provider): 在使用 Rspack 构建时，支持 legalComments `linked` 和 `none` 配置项

- 160a0b3: feat(rspack-provider): update Rspack to 0.1.10

  feat(rspack-provider): 升级 Rspack 相关依赖到 0.1.10

- Updated dependencies [9b0b7ef]
  - @modern-js/builder-shared@2.18.1
  - @modern-js/server@2.18.1
  - @modern-js/e2e@2.18.1
  - @modern-js/types@2.18.1
  - @modern-js/utils@2.18.1

## 2.18.0

### Minor Changes

- 7de6599: feat: rspack-provider support modern.js ssr mode
  feat: rspack-provider 支持 modern.js ssr 模式

### Patch Changes

- ea60b58: refactor(node-polyfill): using Rspack builtins to provide global variables

  refactor(node-polyfill): 通过 Rspack 内置的 provide 注入全局变量

  - @modern-js/builder-shared@2.18.0
  - @modern-js/server@2.18.0
  - @modern-js/e2e@2.18.0
  - @modern-js/types@2.18.0
  - @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/builder-shared@2.17.1
- @modern-js/server@2.17.1
- @modern-js/e2e@2.17.1
- @modern-js/types@2.17.1
- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/builder-shared@2.17.0
- @modern-js/server@2.17.0
- @modern-js/e2e@2.17.0
- @modern-js/types@2.17.0
- @modern-js/utils@2.17.0

## 2.16.0

### Minor Changes

- 7596520: feat(builder): builder plugin supports specifying relative order via the `pre` / `post` configuration items

  feat(builder): builder 插件支持通过 `pre` / `post` 配置项指定相对顺序

### Patch Changes

- 50bc0db: feat(builder): update swc-plugins, core-js, swc-helpers
  feat(builder): 更新 swc-plugins, core-js, swc-helpers
- fd4a8a6: chore(deps): bump postcss-custom-properties to v13.1.5

  chore(deps): 升级 postcss-custom-properties 到 v13.1.5

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- Updated dependencies [fe92de6]
- Updated dependencies [091986a]
- Updated dependencies [5954330]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
- Updated dependencies [e4e0e01]
  - @modern-js/builder-shared@2.16.0
  - @modern-js/utils@2.16.0
  - @modern-js/server@2.16.0
  - @modern-js/types@2.16.0
  - @modern-js/e2e@2.16.0

## 2.15.0

### Minor Changes

- 3e5e790: feat(transformImport): support disable default transform import, add more test of transformImport

  feat(transformImport): 支持关闭默认的 transform import，增加更多 transformImport 测试

### Patch Changes

- 7d23d39: fix: rspack back to v0.1.7

  fix: rspack 回退到 v0.1.7

- Updated dependencies [3e5e790]
  - @modern-js/builder-shared@2.15.0
  - @modern-js/server@2.15.0
  - @modern-js/e2e@2.15.0
  - @modern-js/types@2.15.0
  - @modern-js/utils@2.15.0

## 2.14.0

### Patch Changes

- fefd1c5: feat(builder): add convertToRem.inlineRuntime config

  feat(builder): 新增 convertToRem.inlineRuntime 配置项

- 4baf588: fix(monorepo): ignore unnessary peer deps warning from antd

  fix(monorepo): 忽略由 antd 造成的不必要的 peer deps 警告

- d0efae3: chore(rspack-provider): update rspack to 0.1.8

  chore(rspack-provider): 升级 rspack 相关依赖到 0.1.8 版本

- 864d55e: feat(builder): source.globalVars support function usage

  feat(builder): source.globalVars 支持函数写法

- b965df2: fix(builder): update source.alias type when using Rspack

  fix(builder): 更新使用 Rspack 时的 source.alias 类型

- Updated dependencies [b46fbcb]
- Updated dependencies [4779152]
- Updated dependencies [fefd1c5]
- Updated dependencies [8a3c693]
- Updated dependencies [9321bef]
- Updated dependencies [9b45c58]
- Updated dependencies [1f34dba]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [864d55e]
- Updated dependencies [b965df2]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/builder-shared@2.14.0
  - @modern-js/server@2.14.0
  - @modern-js/utils@2.14.0
  - @modern-js/types@2.14.0
  - @modern-js/e2e@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/builder-shared@2.13.4
- @modern-js/server@2.13.4
- @modern-js/e2e@2.13.4
- @modern-js/types@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- Updated dependencies [18cd03f]
- Updated dependencies [28583e8]
  - @modern-js/builder-shared@2.13.3
  - @modern-js/server@2.13.3
  - @modern-js/e2e@2.13.3
  - @modern-js/types@2.13.3
  - @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- @modern-js/builder-shared@2.13.2
- @modern-js/server@2.13.2
- @modern-js/e2e@2.13.2
- @modern-js/types@2.13.2
- @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/builder-shared@2.13.1
- @modern-js/server@2.13.1
- @modern-js/e2e@2.13.1
- @modern-js/types@2.13.1
- @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- c89de05: chore(rspack-provider): apply fullySpecified mjs default value in Rspack

  chore(rspack-provider): 在 Rspack 中设置 fullySpecified 在 mjs 下的默认值

- d69c0b9: fix: pin core-js version to 3.27 in SWC

  fix: SWC 相关的 core-js 版本固定到 3.27

- 5deb1fb: chore: bump core-js and swc

  chore: 升级 core-js 和 swc

- 9c0572e: chore(builder): support get builder/shared compiled path in provider getCompiledPath api

  chore(builder): 支持通过 provider getCompiledPath api 获取 builder/shared 中预打包依赖路径

- 538d1a8: feat(rspack-provider): update Rspack to 0.1.7

  feat(rspack-provider): 升级 Rspack 相关依赖至 0.1.7

- Updated dependencies [1feacdc]
- Updated dependencies [384406c]
- Updated dependencies [c89de05]
- Updated dependencies [348306d]
- Updated dependencies [384e393]
- Updated dependencies [9c0572e]
  - @modern-js/builder-shared@2.13.0
  - @modern-js/server@2.13.0
  - @modern-js/e2e@2.13.0
  - @modern-js/types@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- cd1d966: chore(rspack-provider): use rspack stats.time instead of manual timing

  chore(rspack-provider): 使用 rspack stats.time 代替手动计时

- fef3394: fix(builder): should add id prefix after minify SVG

  fix(builder): 压缩 SVG 后需要添加 id 前缀

- 6b30837: chore(rspack-provider): update rspack to 0.1.6

  chore(rspack-provider): 升级 rspack 相关依赖到 0.1.6

- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
- Updated dependencies [fef3394]
  - @modern-js/utils@2.12.0
  - @modern-js/builder-shared@2.12.0
  - @modern-js/server@2.12.0
  - @modern-js/e2e@2.12.0
  - @modern-js/types@2.12.0

## 2.11.0

### Minor Changes

- a8c08c3: feat: 添加 `source.transformImoprt`

  feat: add `source.transformImoprt`

### Patch Changes

- a9c6083: fix(builder): incorrect asset URL in windows

  fix(builder): 修复 windows 上生成静态资源 URL 错误的问题

- 55b07fd: feat(builder): support output.assetsRetry in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.assetsRetry 配置能力

- c0ba89b: feat: 控制台输出 rspack 版本
  feat: Print the version of rspack in the console.
- cd1040f: feat: use generated default config objects instead of global objects
  feat: 默认配置项使用动态生成替代全局对象
- e262a99: fix(builder): failed to set empty distPath.js/css

  fix(builder): 修复设置 distPath.js/css 为空时报错的问题

- 1140a69: chore(rspack-builder): update Rspack to 0.1.4

  chore(rspack-builder): 升级 Rspack 相关依赖至 0.1.4 版本

- b71cef1: feat(builder): support setting forceSplitting to be an object

  feat(builder): 支持将 forceSplitting 设置为一个对象

- 274b2e5: fix: For rspack-provider can use `tools.babel` configuration, inline the `@babel/preset-typescript` to handle ts syntax in rspack-provider.
  fix: 为了 rspack-provider 能给使用 `tools.babel` 配置项，将 `@babel/preset-typescript` 内置进 rspack-provider 去处理 ts 语法。
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
  - @modern-js/server@2.11.0
  - @modern-js/e2e@2.11.0
  - @modern-js/types@2.11.0

## 2.10.0

### Minor Changes

- a8db932: feat: rspack-provider support tools.babel
  feat: rspack-provider 支持 tools.babel

### Patch Changes

- 4d54233: chore(builder): update rspack & show rspack format error

  chore(builder): 更新 rspack 版本 & 优化 rspack 错误日志输出

- cfdbf80: fix(builder): update source.define type and schema check in rspack-provider

  fix(builder): 更新 rspack-provider 中 source.define 的类型定义与校验

- ed55acb: fix: Temporary forbidden the `tools.babel` in rspack ,because the `tools.babel` in rspack would cause a syntax error
  fix: 由于使用 tools.babel 会引起语法错误，暂时在 rspack 中禁用 tools.babel 配置能力
- Updated dependencies [a8db932]
- Updated dependencies [3e0bd50]
- Updated dependencies [92d247f]
- Updated dependencies [0da32d0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/builder-shared@2.10.0
  - @modern-js/server@2.10.0
  - @modern-js/types@2.10.0
  - @modern-js/utils@2.10.0
  - @modern-js/e2e@2.10.0

## 2.9.0

### Patch Changes

- 76b26883bb: fix: rspack-provider swc plugin should not inject core-js in ssr.
  fix: rspack-provider swc 插件不应该在 SSR 下注入 core-js
- 07569e577e: fix(builder): add additional note about hashDigest in cssModuleLocalIdentName

  fix(builder): 添加 cssModuleLocalIdentName 中关于 hashDigest 的补充说明

- Updated dependencies [49bb8cd0ef]
  - @modern-js/server@2.9.0
  - @modern-js/builder-shared@2.9.0
  - @modern-js/e2e@2.9.0
  - @modern-js/types@2.9.0
  - @modern-js/utils@2.9.0

## 2.8.0

### Minor Changes

- 40f5039b17: feat(builder): update rspack to 0.1.0

  feat(builder): 升级 rspack 至 0.1.0

### Patch Changes

- bc943c9b04: fix: specify the resolve.conditionNames when target = node.
  fix: 当 target = node，指定 resolve.conditionNames
- 1242f5d8d6: fix(builder-rspack-provider): support entry mode polyfill

  fix(builder-rspack-provider): 支持 entry 模式的 polyfill 注入

- 457ee832b9: hotfix(builder): use community loader instead of Rspack unstable sass & less loader

  hotfix(builder): 使用社区 sass-loader 和 less-loader 替代 Rspack 非稳定的 sass 和 less loader

- Updated dependencies [ea7bb41e30]
- Updated dependencies [bd369a89a4]
- Updated dependencies [1104a9f18b]
- Updated dependencies [70d82e1408]
- Updated dependencies [2c1151271d]
- Updated dependencies [481461a61d]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/server@2.8.0
  - @modern-js/builder-shared@2.8.0
  - @modern-js/utils@2.8.0
  - @modern-js/types@2.8.0
  - @modern-js/e2e@2.8.0

## 2.7.0

### Patch Changes

- 206c806efa: fix(rspack-provider): missing tools.autoprefixer type

  fix(rspack-provider): 修复缺少 tools.autoprefixer 类型定义的问题

- 3a942a2472: feat: add Rspack provider swc options, add builder-plugin-swc overrideBrowserslist configuration, report warning when enable latestDecorator in builder-plugin-swc

  feat: 给 Rspack provider 增加 swc 相关配置项，增加 builder-plugin-swc overrideBrowserslist 配置，在 builder-plugin-swc 启用 latestDecorator 后增加 warning 报错

- 5f899af53a: feat(builder): support output.enableAssetFallback in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.enableAssetFallback 配置项

- 1b913372b4: feat: 增加 copy 配置以及对 core-js path 的 alias

  feat: support copy config and add alias of core-js

- Updated dependencies [206c806efa]
- Updated dependencies [6378e26bf9]
- Updated dependencies [0f15fc597c]
- Updated dependencies [5f899af53a]
- Updated dependencies [dcad887024]
- Updated dependencies [a4672f7c16]
- Updated dependencies [ebe0d2dd6e]
- Updated dependencies [7fff9020e1]
- Updated dependencies [1eea234fdd]
- Updated dependencies [84bfb439b8]
  - @modern-js/builder-shared@2.7.0
  - @modern-js/server@2.7.0
  - @modern-js/utils@2.7.0
  - @modern-js/types@2.7.0
  - @modern-js/e2e@2.7.0

## 2.6.0

### Patch Changes

- 0fe658a: feat(builder): support passing URL to html.favicon

  feat(builder): 支持在 html.favicon 中直接传入 URL

- Updated dependencies [b92d6db]
- Updated dependencies [ba6db6e]
- Updated dependencies [ba6db6e]
- Updated dependencies [e1f799e]
- Updated dependencies [107f674]
- Updated dependencies [7915ab3]
- Updated dependencies [03d7f7d]
- Updated dependencies [fae9d1b]
- Updated dependencies [49fa0b1]
- Updated dependencies [0fe658a]
- Updated dependencies [62930b9]
  - @modern-js/builder-shared@2.6.0
  - @modern-js/server@2.6.0
  - @modern-js/utils@2.6.0
  - @modern-js/types@2.6.0
  - @modern-js/e2e@2.6.0

## 2.5.0

### Minor Changes

- 28e7dc6: feat: more use bunlder chain to modify bundler config
  feat: 更多的使用 `bunlder chain` 去修改 bunlder 配置

### Patch Changes

- 30614fa: chore: modify package.json entry fields and build config
  chore: 更改 package.json entry 字段以及构建配置
- c4c10e7: refactor: refactor rules for static assets processing with rule.oneOf, reuse svg/font/image/media plugin

  refactor: 使用 oneOf 重构静态资源处理规则 & 复用 svg / font / media / img 插件

- 84c21f9: fix(builder-webpack-provider): correct mistaken compilerOptions usage in ts-loader options

  fix(builder-webpack-provider): 改正 ts-loader options 中错误的 compilerOptions

- 1b0ce87: chore: bump caniuse-lite to latest version

  chore: 升级 caniuse-lite 到最新版

- c5ea222: feat(builder): support mergeConfig util in tools.webpack

  feat(builder): 支持在 tools.webpack 中使用 mergeConfig 工具函数

- 40230b3: feat(builder): enable postcss plugins based on browserslist

  feat(builder): 基于 browserslist 来启用需要的 postcss 插件

- Updated dependencies [58a9918]
- Updated dependencies [89ca6cc]
- Updated dependencies [7cb8bb4]
- Updated dependencies [bb4e712]
- Updated dependencies [6fca567]
- Updated dependencies [30614fa]
- Updated dependencies [c4c10e7]
- Updated dependencies [1b0ce87]
- Updated dependencies [11c053b]
- Updated dependencies [f0b3d8c]
- Updated dependencies [28e7dc6]
- Updated dependencies [40230b3]
  - @modern-js/builder-shared@2.5.0
  - @modern-js/server@2.5.0
  - @modern-js/types@2.5.0
  - @modern-js/utils@2.5.0
  - @modern-js/e2e@2.5.0

## 2.4.0

### Minor Changes

- a5572b8: feat: more plugin rebase in `builder-shared`
  feat: 更多 plugin 下沉到 `builder-shared`
- a914be8: feat: modern-js support Rspack bundler
  feat: modern-js 支持 Rspack 构建工具

### Patch Changes

- 6f83037: fix: change the builder resolve plugin
  fix: 修复 builder resolve 插件
- 014d06b: feat: reuse bundleAnalyzer plugin, support performance.bundleAnalyze config in rspack-provider

  feat: 复用 bundleAnalyzer 插件，在 rspack-provider 中支持 performance.bundleAnalyze 配置项

- 48b036e: fix(builder): should not generate cache when build failed

  fix(builder): 修复构建失败时会生成无效编译缓存的问题

- 8c2db5f: feat(core): improve support for exporting a function in config file

  feat(core): 完善对配置文件中导出函数的支持

- Updated dependencies [d19484c]
- Updated dependencies [6f83037]
- Updated dependencies [014d06b]
- Updated dependencies [98a2733]
- Updated dependencies [a5572b8]
- Updated dependencies [a914be8]
- Updated dependencies [8c2db5f]
  - @modern-js/server@2.4.0
  - @modern-js/builder-shared@2.4.0
  - @modern-js/utils@2.4.0
  - @modern-js/e2e@2.4.0
  - @modern-js/types@2.4.0

## 2.3.0

### Patch Changes

- 7cd8185: chore: reuse splitChunks plugin between rspack-provider and webpack-provider

  chore: 在 rspack-provider 和 webpack-provider 间复用 splitChunks plugin

- 4dfe1bf: feat(rspack-builder): add Rspack minimize plugin

  feat(rspack-builder): 添加 Rspack minimize 插件

- Updated dependencies [fd5a3ed]
- Updated dependencies [67ba34a]
- Updated dependencies [2ad9fdf]
- Updated dependencies [f9a26fe]
- Updated dependencies [6ca1c0b]
- Updated dependencies [89b6739]
- Updated dependencies [ff48fc2]
  - @modern-js/utils@2.3.0
  - @modern-js/builder-shared@2.3.0
  - @modern-js/server@2.3.0
  - @modern-js/e2e@2.3.0
  - @modern-js/types@2.3.0

## 2.2.0

### Patch Changes

- f2f8a83: chore: reuse rem AutoSetRootFontSizePlugin between rspack-provider and webpack-provider

  chore: 在 rspack-provider 和 webpack-provider 间复用 rem AutoSetRootFontSizePlugin

- cb12ee7: chore: remove some unused deps, bump postcss version

  chore: 移除未使用的依赖, 升级 postcss 版本

- 16bdc0a: chore: adjust builder plugin name

  chore: 调整 builder 插件命名格式

- Updated dependencies [f2f8a83]
- Updated dependencies [49eff0c]
- Updated dependencies [9fc6de9]
- Updated dependencies [19bb384]
  - @modern-js/builder-shared@2.2.0
  - @modern-js/utils@2.2.0
  - @modern-js/server@2.2.0
  - @modern-js/types@2.2.0
  - @modern-js/e2e@2.2.0

## 2.1.0

### Patch Changes

- 3ad26c2: feat: add util `mergeBuilderConfig` for `modifyBuilderConfig` hook

  feat: `modifyBuilderConfig` 钩子回调提供工具函数 `mergeBuilderConfig`

- 5b54418: fix(builder): no longer remove comments of HTML

  fix(builder): 不再默认移除 HTML 中的注释

- Updated dependencies [837620c]
- Updated dependencies [3d0fb38]
- Updated dependencies [3ad26c2]
- Updated dependencies [5b54418]
- Updated dependencies [ccbac43]
- Updated dependencies [8a9482c]
- Updated dependencies [679296d]
  - @modern-js/utils@2.1.0
  - @modern-js/server@2.1.0
  - @modern-js/builder-shared@2.1.0
  - @modern-js/e2e@2.1.0
  - @modern-js/types@2.1.0

## 2.0.0

### Major Changes

Initial Release
