# @modern-js/builder-shared

## 2.28.0

### Patch Changes

- 6400d98: chore(builder): using htmlparser2 to replace cheerio

  chore(builder): 使用 htmlparser2 代替 cheerio

- 362416f: feat(builder): support import Node.js addons when target is node

  feat(builder): 支持在 target 为 node 时引用 Node.js addons

- aa0c0c3: fix(builder): rem code not injected when using modern.js custom HTML Template

  fix(builder): 修复在使用 modern.js 自定义 HTML 模版时 rem 脚本不注入的问题

- 9301e46: chore(builder): optimize some error format of zod validation and add joint verification of rspack css related configuration

  chore(builder): 优化 builder schema 校验的部分错误输出格式，并为 rspack 添加 css 相关配置的联合校验

- 00b58a7: feat(builder): add an error tip for source.include

  feat(builder): 增加 source.include 常见问题的提示日志

- 820bfe9: feat(builder): add checkSyntax.ecmaVersion option

  feat(builder): 新增 checkSyntax.ecmaVersion 选项

- Updated dependencies [4e3ce96]
- Updated dependencies [6eae1e7]
- Updated dependencies [00b58a7]
  - @modern-js/types@2.28.0
  - @modern-js/prod-server@2.28.0
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

- d9080ed: fix(builder): remove unused source map of inlined files

  fix(builder): 移除内联文件多余的 source map

- 67d0b0c: fix(builder): failed to disable html via htmlPlugin: false

  fix(builder): 修复通过 htmlPlugin: false 无法禁用 html 的问题

- Updated dependencies [91d14b8]
- Updated dependencies [6d7104d]
  - @modern-js/utils@2.27.0
  - @modern-js/prod-server@2.27.0
  - @modern-js/server@2.27.0
  - @modern-js/types@2.27.0

## 2.26.0

### Patch Changes

- 150ddb1: fix(builder-shared): set formatStats fn as sync-fn so that info can print quikly
  fix(builder-shared): 将 formatStats 设置成同步函数使构建信息能够尽快的打印出来
- 15ad760: fix(builder): incorrect CSS rules when enable asset fallback

  fix(builder): 修复开启 asset fallback 时 CSS 规则错误的问题

- 786c195: feat(builder-shared): add sourceBuild type definition
  feat(builder-shared): 新增 sourceBuild 类型定义
  - @modern-js/server@2.26.0
  - @modern-js/prod-server@2.26.0
  - @modern-js/types@2.26.0
  - @modern-js/utils@2.26.0

## 2.25.2

### Patch Changes

- 15a8276: fix(builder): failed to set publicPath function

  fix(builder): 修复设置 publicPath 函数时报错的问题

- 272646c: feat(builder): bump webpack v5.88, support top level await

  feat(builder): 升级 webpack v5.88, 支持 top level await

- Updated dependencies [63d8247]
- Updated dependencies [6651684]
- Updated dependencies [272646c]
- Updated dependencies [358ed24]
  - @modern-js/utils@2.25.2
  - @modern-js/server@2.25.2
  - @modern-js/prod-server@2.25.2
  - @modern-js/types@2.25.2

## 2.25.1

### Patch Changes

- b10045f: fix(builder): checkSyntax targets should get default browserlist when only set checkSyntax.exclude

  fix(builder): 当只设置 checkSyntax.exclude 时，checkSyntax targets 应该使用默认的 broserlist 值

- Updated dependencies [9f78d0c]
  - @modern-js/utils@2.25.1
  - @modern-js/prod-server@2.25.1
  - @modern-js/server@2.25.1
  - @modern-js/types@2.25.1

## 2.25.0

### Patch Changes

- Updated dependencies [2491875]
- Updated dependencies [5732c6a]
  - @modern-js/prod-server@2.25.0
  - @modern-js/types@2.25.0
  - @modern-js/utils@2.25.0
  - @modern-js/server@2.25.0

## 2.24.0

### Patch Changes

- ef041c0: chore(builder): reuse externals plugin

  chore(builder): 复用 externals 插件

- Updated dependencies [c882fbd]
- Updated dependencies [8c9923f]
- Updated dependencies [0424a2d]
- Updated dependencies [4a82c3b]
  - @modern-js/types@2.24.0
  - @modern-js/utils@2.24.0
  - @modern-js/server@2.24.0
  - @modern-js/prod-server@2.24.0

## 2.23.1

### Patch Changes

- 5772927: feat(rspack-provider): support import .wasm assets

  feat(rspack-provider): 支持引用 .wasm 资源

- 811ccd4: fix: add attributes for inline runtime script
  fix: 为 inline runtime 脚本添加属性
- 5a3eeff: fix(builder): assetsRetry cause global variable pollution

  fix(builder): 修复 assetsRetry 污染全局变量的问题

- 4d4dca0: feat(builder): add new plugin.remove option

  feat(builder): 新增 plugin.remove 选项

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1
  - @modern-js/prod-server@2.23.1
  - @modern-js/server@2.23.1
  - @modern-js/types@2.23.1

## 2.23.0

### Patch Changes

- 15eac36: chore(builder): move more default config to shared package

  chore(builder): 移动更多默认 config 到 shared 包

- d4e85c1: fix(rspack-provider): should inject polyfill for web-worker target

  fix(rspack-provider): 修复 web-worker target 未注入 polyfill 的问题

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- f14f920: feat(rspack-provider): support disableCssExtract in rspack

  feat(rspack-provider): 在 Rspack 构建时支持 disableCssExtract 能力

- 692cc0e: fix(builder): assetsRetry.crossOrigin default to html.crossorigin

  fix(builder): assetsRetry.crossOrigin 默认值与 html.crossorigin 保持一致

- 38eccef: chore(builder): move getPostcssConfig and postcss related pkg to builder-shared

  chore(builder): 将 getPostcssConfig 和 postcss 相关的 pkg 移动到 builder-shared 中

- f91c557: fix(builder): failed to minify css when use style-loader in Rspack

  fix(builder): 修复使用 Rspack + style-loader 时未压缩 CSS 的问题

- a82d6f7: fix(builder): single-vendor chunkSplit not work as expected

  fix(builder): single-vendor 拆包规则未按照预期生效

- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [6dec7c2]
- Updated dependencies [c3216b5]
  - @modern-js/prod-server@2.23.0
  - @modern-js/server@2.23.0
  - @modern-js/types@2.23.0
  - @modern-js/utils@2.23.0

## 2.22.1

### Patch Changes

- a470c04: chore(builder): reuse rem plugin between rspack and webpack provider

  chore(builder): 在 rspack 和 webpack provider 间复用 rem 插件

- 95ffa6b: fix(builder): support filter css modules file by cssLoader.modules.auto Regexp

  fix(builder): 支持过滤 css modules 文件根据 tools.cssLoader.modules.auto 正则配置

- 12d54ae: feat(builder): add new builder-cli npm package

  feat(builder): 新增 builder-cli npm 包

- bd4b150: feat(builder): add builder.serve method

  feat(builder): 新增 builder.serve 方法

- dd36311: fix(builder-shared): the webworker should not check is a client compiler.
  fix(builder-shared): webworker 不应该被判定为客户端 compiler
- d4045ed: fix(builder): print https URLs when devServer.https is true

  fix(builder): 当 devServer.https 为 true 时，输出 https 的 URLs

- 8bd9981: fix(builder): use postcss-loader instead of @rspack/postcss-loader to fix tailwindcss hmr bug

  fix(builder): 使用 postcss-loader 代替 @rspack/postcss-loader, 来修复 tailwindcss hmr 问题

- 1f02cd2: chore: fix some eslint issues

  chore: 修复一些 eslint issues

- cfcf003: fix(plugin-swc): styledComponents configuration not work

  fix(plugin-swc): 修复 styledComponents 配置不生效的问题

- 15181be: fix(builder): only generator .d.ts file for css-modules file when enableCssModuleTSDeclaration

  fix(builder): 当开启 enableCssModuleTSDeclaration 时仅为 css modules 文件生成 .d.ts 声明

- Updated dependencies [25b490a]
- Updated dependencies [e2848a2]
- Updated dependencies [d4045ed]
- Updated dependencies [1f02cd2]
  - @modern-js/types@2.22.1
  - @modern-js/utils@2.22.1
  - @modern-js/server@2.22.1
  - @modern-js/prod-server@2.22.1

## 2.22.0

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- 850cde6: feat(builder): add arco config to transformImport by default

  feat(builder): 默认增加 arco 的 transformImport 配置

- Updated dependencies [3d48836]
- Updated dependencies [5050e8e]
  - @modern-js/utils@2.22.0
  - @modern-js/server@2.22.0
  - @modern-js/types@2.22.0

## 2.21.1

### Patch Changes

- 19b3b64: fix(builder): fix the misalignment of the dependencies version that fork-ts-checker-webpack-plugin and autoprefixer depends on

  fix(builder): 修复 fork-ts-checker-webpack-plugin 和 autoprefixer 的依赖版本错位问题

  - @modern-js/server@2.21.1
  - @modern-js/types@2.21.1
  - @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- 7d2972e: feat(builder): update rspack to 0.1.12

  feat(builder): 升级 rspack 到 0.1.12 版本

- 863f8df: feat(rspack-provider): support security.checkSyntax in Rspack

  feat(rspack-provider): 在使用 Rspack 构建时支持 security.checkSyntax 配置项

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 1ef03dc: feat(dev-server): enable gzip compression, add devServer.compress config

  feat(dev-server): 默认启用 gzip 压缩，新增 devServer.compress 配置项

- 4274510: fix(builder): failed to disable html via htmlPlugin: false

  fix(builder): 修复通过 htmlPlugin: false 无法禁用 html 的问题

- 43b4e83: feat: support security.nonce for add nonce attribute on script tag
  feat: 支持 security.nonce 配置，为 script 标签添加 nonce 属性
- ad78387: chore(deps): bump babel-related dependencies to latest version

  chore(deps): 升级 babel 相关依赖到最新版本

- Updated dependencies [e81eeaf]
- Updated dependencies [26dcf3a]
- Updated dependencies [1ef03dc]
- Updated dependencies [056627f]
- Updated dependencies [8fa8566]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/utils@2.21.0
  - @modern-js/server@2.21.0
  - @modern-js/types@2.21.0

## 2.20.0

### Patch Changes

- 3c4e0a5: chore(utils): move generateMetaTags method to builder-shared

  chore(utils): 移动 generateMetaTags 方法到 builder-shared

- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
- Updated dependencies [5f055ab]
  - @modern-js/utils@2.20.0
  - @modern-js/server@2.20.0
  - @modern-js/types@2.20.0

## 2.19.1

### Patch Changes

- afb735f: fix(builder): failed to print file size in some cases

  fix(builder): 修复部分情况下输出产物体积失败的问题

  - @modern-js/server@2.19.1
  - @modern-js/types@2.19.1
  - @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- 1134fe2: chore(deps): bump webpack from 5.76.2 to 5.82.1

  chore(deps): 将 webpack 从 5.76.2 升级至 5.82.1

- Updated dependencies [1134fe2]
  - @modern-js/server@2.19.0
  - @modern-js/utils@2.19.0
  - @modern-js/types@2.19.0

## 2.18.1

### Patch Changes

- 9b0b7ef: feat(rspack-provider): support tools.pug configuration when Rspack build

  feat(rspack-provider): 在使用 Rspack 构建时支持 tools.pug 配置项

  - @modern-js/server@2.18.1
  - @modern-js/types@2.18.1
  - @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- @modern-js/server@2.18.0
- @modern-js/types@2.18.0
- @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/server@2.17.1
- @modern-js/types@2.17.1
- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/server@2.17.0
- @modern-js/types@2.17.0
- @modern-js/utils@2.17.0

## 2.16.0

### Minor Changes

- 7596520: feat(builder): builder plugin supports specifying relative order via the `pre` / `post` configuration items

  feat(builder): builder 插件支持通过 `pre` / `post` 配置项指定相对顺序

### Patch Changes

- fe92de6: fix(builder): browserslist config should not affect node bundles

  fix(builder): 修复 browserslist 配置会对 node 产物生效的问题

- 091986a: hotfix(builder): fix the inaccurate type when bundlerChain chain called

  hotfix(builder):修复 bundlerChain 链式调用后，类型提示不准确问题

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- e4e0e01: fix(builder-shared): add protocol for generated URL when assetPrefix is true

  fix(builder-shared): assetPrefix 为 true 时生成的 URL 添加 protocol

- Updated dependencies [5954330]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
  - @modern-js/utils@2.16.0
  - @modern-js/server@2.16.0
  - @modern-js/types@2.16.0

## 2.15.0

### Minor Changes

- 3e5e790: feat(transformImport): support disable default transform import, add more test of transformImport

  feat(transformImport): 支持关闭默认的 transform import，增加更多 transformImport 测试

### Patch Changes

- @modern-js/server@2.15.0
- @modern-js/types@2.15.0
- @modern-js/utils@2.15.0

## 2.14.0

### Patch Changes

- b46fbcb: fix: The http://0.0.0.0:port can't visit in windows, we shouldn't set publicPath as `//0.0.0.0:${port}/`;
  fix: 在 windows 里不能正常访问 http://0.0.0.0:port，我们不应该将 publicPath 设置成 `//0.0.0.0:${port}`
- fefd1c5: feat(builder): add convertToRem.inlineRuntime config

  feat(builder): 新增 convertToRem.inlineRuntime 配置项

- 8a3c693: chore(server): no longer replace globalVars when compiler is babel

  chore(server): 进行 babel compile 时不再替换 globalVars

- 9b45c58: fix(app-tools): should not print all addresses when custom dev.host

  fix(app-tools): 修复自定义 dev.host 时会输出多余的 URL 地址的问题

- 864d55e: feat(builder): source.globalVars support function usage

  feat(builder): source.globalVars 支持函数写法

- b965df2: fix(builder): update source.alias type when using Rspack

  fix(builder): 更新使用 Rspack 时的 source.alias 类型

- Updated dependencies [4779152]
- Updated dependencies [9321bef]
- Updated dependencies [9b45c58]
- Updated dependencies [1f34dba]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/server@2.14.0
  - @modern-js/utils@2.14.0
  - @modern-js/types@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/server@2.13.4
- @modern-js/types@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- 18cd03f: fix(builder): devServer.client is not deep merged

  fix(builder): devServer.client 配置项未被 deep merged

- 28583e8: feat(builder): add assetsRetry.inlineScript config

  feat(builder): 新增 assetsRetry.inlineScript 配置项

  - @modern-js/server@2.13.3
  - @modern-js/types@2.13.3
  - @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- @modern-js/server@2.13.2
- @modern-js/types@2.13.2
- @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/server@2.13.1
- @modern-js/types@2.13.1
- @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- 1feacdc: feat(builder): support using RegExp to inline part of chunks

  feat(builder): 支持通过正则来内联部分资源

- 384406c: fix(builder): `HtmlTagsPlugin` failed to join public path with absolute url
  fix(builder): `HtmlTagsPlugin` 为绝对路径拼接 public path 会导致格式错误
- c89de05: chore(rspack-provider): apply fullySpecified mjs default value in Rspack

  chore(rspack-provider): 在 Rspack 中设置 fullySpecified 在 mjs 下的默认值

- 348306d: feat(builder): add html.scriptLoading config

  feat(builder): 新增 html.scriptLoading 配置

- 384e393: chore: support output.merge / resolve.merge / resolve.get / resolve.fallback in bundler-chain

  chore: 在 bundler-chain 中支持 output.merge / resolve.merge / resolve.get / resolve.fallback 方法

- 9c0572e: chore(builder): support get builder/shared compiled path in provider getCompiledPath api

  chore(builder): 支持通过 provider getCompiledPath api 获取 builder/shared 中预打包依赖路径

  - @modern-js/server@2.13.0
  - @modern-js/types@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- 6d86e34: feat(doc-tools): print dev server URLs with base

  feat(doc-tools): 输出 dev server 的 URLs 时补全 base 信息

- fef3394: fix(builder): should add id prefix after minify SVG

  fix(builder): 压缩 SVG 后需要添加 id 前缀

- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
  - @modern-js/utils@2.12.0
  - @modern-js/server@2.12.0
  - @modern-js/types@2.12.0

## 2.11.0

### Minor Changes

- a8c08c3: feat: 添加 `source.transformImoprt`

  feat: add `source.transformImoprt`

### Patch Changes

- adcedad: fix: The compiled babel-loader can't find the babel/core in builder-shared
  fix: 在 builder-shared 中的预编译 babel-loader 找不到 babel/core 依赖
- a9c6083: fix(builder): incorrect asset URL in windows

  fix(builder): 修复 windows 上生成静态资源 URL 错误的问题

- 55b07fd: feat(builder): support output.assetsRetry in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.assetsRetry 配置能力

- 8b90c79: fix(builder): should preserve viewBox when minify svg

  fix(builder): 修复压缩 svg 导致 viewBox 丢失的问题

- 3aa318d: fix(rspack-builder): support rspack global node-polyfill use workaround

  fix(rspack-builder): 采用临时方案在 rspack 中支持 global node-polyfill

- 53b0a63: fix: schema parser error, builder tools.devServer.proxy can be a array
  fix: schema 解析错误，builder `tools.devSerer.proxy' 可以是个数组。
- 381a3b9: feat(utils): move universal utils to the universal folder

  feat(utils): 将运行时使用的 utils 移动到 universal 目录

- cd1040f: feat: use generated default config objects instead of global objects
  feat: 默认配置项使用动态生成替代全局对象
- e262a99: fix(builder): failed to set empty distPath.js/css

  fix(builder): 修复设置 distPath.js/css 为空时报错的问题

- b71cef1: feat(builder): support setting forceSplitting to be an object

  feat(builder): 支持将 forceSplitting 设置为一个对象

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
  - @modern-js/server@2.11.0
  - @modern-js/types@2.11.0

## 2.10.0

### Minor Changes

- a8db932: feat: rspack-provider support tools.babel
  feat: rspack-provider 支持 tools.babel

### Patch Changes

- 92d247f: fix: support tools.devServer.header include string[] type, remove get & delete & apply api in hook or middleware api
  fix: 支持 tools.devServer.header 包含字符串数组类型，移除 Hook 和 Middleware 中对 响应 Cookie 的获取、删除操作
- 0d9962b: fix: add types field in package.json
  fix: 添加 package.json 中的 types 字段
- fbefa7e: chore(deps): bump webpack from 5.75.0 to 5.76.2

  chore(deps): 将 webpack 从 5.75.0 升级至 5.76.2

- Updated dependencies [3e0bd50]
- Updated dependencies [92d247f]
- Updated dependencies [0da32d0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/server@2.10.0
  - @modern-js/types@2.10.0
  - @modern-js/utils@2.10.0

## 2.9.0

### Patch Changes

- Updated dependencies [49bb8cd0ef]
  - @modern-js/server@2.9.0
  - @modern-js/types@2.9.0
  - @modern-js/utils@2.9.0

## 2.8.0

### Minor Changes

- 481461a61d: feat: builder support tools.bundlerChain config
  feat: builder 支持 `tools.bundlerChain` config

### Patch Changes

- bd369a89a4: fix(builder): failed to set CDN URL via html.tags

  fix(builder): 修复 html.tags 无法设置 CDN URL 的问题

- 2c1151271d: fix(builder): fix incorrect browserslist config

  fix(builder): 修复错误的 browserslist 配置

- Updated dependencies [ea7bb41e30]
- Updated dependencies [1104a9f18b]
- Updated dependencies [70d82e1408]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/server@2.8.0
  - @modern-js/utils@2.8.0
  - @modern-js/types@2.8.0

## 2.7.0

### Minor Changes

- 84bfb439b8: feat: support custom apiDir, lambdaDir and style of writing for bff
  feat: 支持定制 api 目录，lambda 目录，bff 的写法

### Patch Changes

- 206c806efa: fix(rspack-provider): missing tools.autoprefixer type

  fix(rspack-provider): 修复缺少 tools.autoprefixer 类型定义的问题

- 5f899af53a: feat(builder): support output.enableAssetFallback in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.enableAssetFallback 配置项

- ebe0d2dd6e: hotfix(builder): make devServer.proxy schema check loosely

  hotfix(builder): devServer.proxy 类型检验采用非严格模式

- Updated dependencies [6378e26bf9]
- Updated dependencies [0f15fc597c]
- Updated dependencies [dcad887024]
- Updated dependencies [a4672f7c16]
- Updated dependencies [7fff9020e1]
- Updated dependencies [1eea234fdd]
- Updated dependencies [84bfb439b8]
  - @modern-js/server@2.7.0
  - @modern-js/utils@2.7.0
  - @modern-js/types@2.7.0

## 2.6.0

### Minor Changes

- fae9d1b: feat(builder): support import .wasm assets

  feat(builder): 支持引用 .wasm 资源

### Patch Changes

- b92d6db: fix(builder): missing dev.beforeStartUrl schema validation

  fix(builder): 修复 dev.beforeStartUrl 缺少 schema 校验的问题

- e1f799e: fix: use 0.0.0.0 instead of localhost as the default dev host
  fix: 使用 0.0.0.0 代替 localhost 作为默认的 dev host
- 107f674: feat(builder): add dev.beforeStartUrl config

  feat(builder): 新增 dev.beforeStartUrl 配置项

- 03d7f7d: fix(builder): fix missing dev.host schema validation

  fix(builder): 修复 dev.host 缺少 schema 校验的问题

- 0fe658a: feat(builder): support passing URL to html.favicon

  feat(builder): 支持在 html.favicon 中直接传入 URL

- 62930b9: fix: support configure host for devServer
  fix: 支持配置 devServer 的 host
- Updated dependencies [ba6db6e]
- Updated dependencies [ba6db6e]
- Updated dependencies [e1f799e]
- Updated dependencies [7915ab3]
- Updated dependencies [49fa0b1]
- Updated dependencies [0fe658a]
- Updated dependencies [62930b9]
  - @modern-js/server@2.6.0
  - @modern-js/utils@2.6.0
  - @modern-js/types@2.6.0

## 2.5.0

### Minor Changes

- 28e7dc6: feat: more use bunlder chain to modify bundler config
  feat: 更多的使用 `bunlder chain` 去修改 bunlder 配置

### Patch Changes

- 58a9918: fix(builder): should not generate HTML for service-worker target

  fix(builder): 修复 target 为 service-worker 时会生成 HTML 的问题

- 30614fa: chore: modify package.json entry fields and build config
  chore: 更改 package.json entry 字段以及构建配置
- c4c10e7: refactor: refactor rules for static assets processing with rule.oneOf, reuse svg/font/image/media plugin

  refactor: 使用 oneOf 重构静态资源处理规则 & 复用 svg / font / media / img 插件

- 11c053b: feat: ssr support deploy worker

  feat: ssr 支持边缘部署

- 40230b3: feat(builder): enable postcss plugins based on browserslist

  feat(builder): 基于 browserslist 来启用需要的 postcss 插件

- Updated dependencies [89ca6cc]
- Updated dependencies [7cb8bb4]
- Updated dependencies [bb4e712]
- Updated dependencies [6fca567]
- Updated dependencies [30614fa]
- Updated dependencies [1b0ce87]
- Updated dependencies [11c053b]
- Updated dependencies [f0b3d8c]
  - @modern-js/server@2.5.0
  - @modern-js/types@2.5.0
  - @modern-js/utils@2.5.0

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

- Updated dependencies [d19484c]
- Updated dependencies [98a2733]
- Updated dependencies [8c2db5f]
  - @modern-js/server@2.4.0
  - @modern-js/utils@2.4.0
  - @modern-js/types@2.4.0

## 2.3.0

### Minor Changes

- f9a26fe: fix(@modern-js/builder-shared): openBrowser add openChrome.applescript script

  fix(@modern-js/builder-shared): openBrowser 添加 openChrome.applescript 脚本

### Patch Changes

- 67ba34a: chore(builder): remove unused ajv schema types

  chore(builder): 移除过时的 ajv 相关类型

- 2ad9fdf: fix(builder-shared): failed to open start URL in macOS

  fix(builder-shared): 修复在 macOS 上打开 start URL 失败的问题

- Updated dependencies [fd5a3ed]
- Updated dependencies [6ca1c0b]
- Updated dependencies [89b6739]
- Updated dependencies [ff48fc2]
  - @modern-js/utils@2.3.0
  - @modern-js/server@2.3.0
  - @modern-js/types@2.3.0

## 2.2.0

### Patch Changes

- f2f8a83: chore: reuse rem AutoSetRootFontSizePlugin between rspack-provider and webpack-provider

  chore: 在 rspack-provider 和 webpack-provider 间复用 rem AutoSetRootFontSizePlugin

- Updated dependencies [49eff0c]
- Updated dependencies [9fc6de9]
- Updated dependencies [19bb384]
  - @modern-js/utils@2.2.0
  - @modern-js/server@2.2.0
  - @modern-js/types@2.2.0

## 2.1.0

### Minor Changes

- 8a9482c: feat(builder): add new option `html.tags` & `html.tagsByEntries`

  feat(builder): 添加新的配置项 `html.tags` 和 `html.tagsByEntries`

### Patch Changes

- 3ad26c2: feat: add util `mergeBuilderConfig` for `modifyBuilderConfig` hook

  feat: `modifyBuilderConfig` 钩子回调提供工具函数 `mergeBuilderConfig`

- 5b54418: fix(builder): no longer remove comments of HTML

  fix(builder): 不再默认移除 HTML 中的注释

- ccbac43: feat: accept undefined as `JSONPrimitive`

  feat: `JSONPrimitive` 类型允许接受 undefined

- 679296d: fix(builder): incorrect config file name when inspect

  fix(builder): 修复 inspect 时配置文件名称不正确的问题

- Updated dependencies [837620c]
- Updated dependencies [3d0fb38]
- Updated dependencies [8a9482c]
  - @modern-js/utils@2.1.0
  - @modern-js/server@2.1.0
  - @modern-js/types@2.1.0

## 2.0.0

### Major Changes

Initial Release
