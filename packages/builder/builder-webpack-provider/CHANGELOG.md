# @modern-js/builder-webpack-provider

## 2.25.1

### Patch Changes

- Updated dependencies [b10045f]
- Updated dependencies [9f78d0c]
  - @modern-js/builder-shared@2.25.1
  - @modern-js/utils@2.25.1
  - @modern-js/babel-preset-app@2.25.1
  - @modern-js/babel-preset-base@2.25.1
  - @modern-js/server@2.25.1
  - @modern-js/types@2.25.1

## 2.25.0

### Patch Changes

- 324cf45: fix(builder): should print recompile log if have type errors

  fix(builder): 如果存在类型错误，则打印 recompile 日志

- Updated dependencies [2491875]
- Updated dependencies [5732c6a]
  - @modern-js/types@2.25.0
  - @modern-js/utils@2.25.0
  - @modern-js/builder-shared@2.25.0
  - @modern-js/server@2.25.0
  - @modern-js/babel-preset-base@2.25.0
  - @modern-js/babel-preset-app@2.25.0

## 2.24.0

### Patch Changes

- ef041c0: chore(builder): reuse externals plugin

  chore(builder): 复用 externals 插件

- 36f5bdf: fix(plugin-vue): remove react-related babel plugins

  fix(plugin-vue): 移除 react 相关的 babel 插件

- Updated dependencies [c882fbd]
- Updated dependencies [8c9923f]
- Updated dependencies [ef041c0]
- Updated dependencies [36f5bdf]
- Updated dependencies [0424a2d]
- Updated dependencies [4a82c3b]
  - @modern-js/types@2.24.0
  - @modern-js/utils@2.24.0
  - @modern-js/server@2.24.0
  - @modern-js/builder-shared@2.24.0
  - @modern-js/babel-preset-base@2.24.0
  - @modern-js/babel-preset-app@2.24.0

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
  - @modern-js/babel-preset-app@2.23.1
  - @modern-js/babel-preset-base@2.23.1
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
  - @modern-js/babel-preset-base@2.23.0
  - @modern-js/babel-preset-app@2.23.0
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

- 8bd9981: fix(builder): use postcss-loader instead of @rspack/postcss-loader to fix tailwindcss hmr bug

  fix(builder): 使用 postcss-loader 代替 @rspack/postcss-loader, 来修复 tailwindcss hmr 问题

- cfcf003: fix(plugin-swc): styledComponents configuration not work

  fix(plugin-swc): 修复 styledComponents 配置不生效的问题

- 15181be: fix(builder): only generator .d.ts file for css-modules file when enableCssModuleTSDeclaration

  fix(builder): 当开启 enableCssModuleTSDeclaration 时仅为 css modules 文件生成 .d.ts 声明

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
  - @modern-js/babel-preset-base@2.22.1
  - @modern-js/babel-preset-app@2.22.1

## 2.22.0

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- ae3fcc2: fix(builder): failed to configure browserslist when target is web-worker

  fix(builder): 修复 target 为 web-worker 时无法配置 browserslist 的问题

- Updated dependencies [3d48836]
- Updated dependencies [5050e8e]
- Updated dependencies [850cde6]
- Updated dependencies [dc45896]
  - @modern-js/builder-shared@2.22.0
  - @modern-js/utils@2.22.0
  - @modern-js/babel-preset-base@2.22.0
  - @modern-js/babel-preset-app@2.22.0
  - @modern-js/server@2.22.0
  - @modern-js/e2e@2.22.0
  - @modern-js/types@2.22.0

## 2.21.1

### Patch Changes

- Updated dependencies [19b3b64]
  - @modern-js/builder-shared@2.21.1
  - @modern-js/server@2.21.1
  - @modern-js/babel-preset-app@2.21.1
  - @modern-js/babel-preset-base@2.21.1
  - @modern-js/e2e@2.21.1
  - @modern-js/types@2.21.1
  - @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 056627f: fix(plugin-sass): pollute the `global.location` object
  fix(plugin-sass): 污染全局对象 `global.location`
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
  - @modern-js/babel-preset-base@2.21.0
  - @modern-js/babel-preset-app@2.21.0
  - @modern-js/server@2.21.0
  - @modern-js/e2e@2.21.0
  - @modern-js/types@2.21.0

## 2.20.0

### Patch Changes

- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
- Updated dependencies [5f055ab]
  - @modern-js/builder-shared@2.20.0
  - @modern-js/utils@2.20.0
  - @modern-js/babel-preset-app@2.20.0
  - @modern-js/server@2.20.0
  - @modern-js/types@2.20.0
  - @modern-js/babel-preset-base@2.20.0
  - @modern-js/e2e@2.20.0

## 2.19.1

### Patch Changes

- Updated dependencies [afb735f]
  - @modern-js/builder-shared@2.19.1
  - @modern-js/babel-preset-app@2.19.1
  - @modern-js/babel-preset-base@2.19.1
  - @modern-js/server@2.19.1
  - @modern-js/e2e@2.19.1
  - @modern-js/types@2.19.1
  - @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- 1134fe2: chore(deps): bump webpack from 5.76.2 to 5.82.1

  chore(deps): 将 webpack 从 5.76.2 升级至 5.82.1

- Updated dependencies [1134fe2]
  - @modern-js/builder-shared@2.19.0
  - @modern-js/server@2.19.0
  - @modern-js/utils@2.19.0
  - @modern-js/babel-preset-app@2.19.0
  - @modern-js/babel-preset-base@2.19.0
  - @modern-js/e2e@2.19.0
  - @modern-js/types@2.19.0

## 2.18.1

### Patch Changes

- 9b0b7ef: feat(rspack-provider): support tools.pug configuration when Rspack build

  feat(rspack-provider): 在使用 Rspack 构建时支持 tools.pug 配置项

- e9ee8ba: perf(builder): reduce map.get calls in tsconfigPathsPlugin

  perf(builder): 减少 tsconfigPathsPlugin 中的 map.get 调用

- 010b67e: fix(builder): incorrect dynamicImportMode when target is web-worker

  fix(builder): 修复 target 为 web-worker 时 dynamicImportMode 错误的问题

- Updated dependencies [9b0b7ef]
  - @modern-js/builder-shared@2.18.1
  - @modern-js/babel-preset-app@2.18.1
  - @modern-js/babel-preset-base@2.18.1
  - @modern-js/server@2.18.1
  - @modern-js/e2e@2.18.1
  - @modern-js/types@2.18.1
  - @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- @modern-js/builder-shared@2.18.0
- @modern-js/babel-preset-app@2.18.0
- @modern-js/babel-preset-base@2.18.0
- @modern-js/server@2.18.0
- @modern-js/e2e@2.18.0
- @modern-js/types@2.18.0
- @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/builder-shared@2.17.1
- @modern-js/babel-preset-app@2.17.1
- @modern-js/babel-preset-base@2.17.1
- @modern-js/server@2.17.1
- @modern-js/e2e@2.17.1
- @modern-js/types@2.17.1
- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/builder-shared@2.17.0
- @modern-js/babel-preset-app@2.17.0
- @modern-js/babel-preset-base@2.17.0
- @modern-js/server@2.17.0
- @modern-js/e2e@2.17.0
- @modern-js/types@2.17.0
- @modern-js/utils@2.17.0

## 2.16.0

### Minor Changes

- 7596520: feat(builder): builder plugin supports specifying relative order via the `pre` / `post` configuration items

  feat(builder): builder 插件支持通过 `pre` / `post` 配置项指定相对顺序

### Patch Changes

- 091986a: hotfix(builder): fix the inaccurate type when bundlerChain chain called

  hotfix(builder):修复 bundlerChain 链式调用后，类型提示不准确问题

- fd4a8a6: chore(deps): bump postcss-custom-properties to v13.1.5

  chore(deps): 升级 postcss-custom-properties 到 v13.1.5

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- Updated dependencies [fe92de6]
- Updated dependencies [091986a]
- Updated dependencies [5954330]
- Updated dependencies [50bc0db]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
- Updated dependencies [e4e0e01]
  - @modern-js/builder-shared@2.16.0
  - @modern-js/utils@2.16.0
  - @modern-js/babel-preset-app@2.16.0
  - @modern-js/babel-preset-base@2.16.0
  - @modern-js/server@2.16.0
  - @modern-js/types@2.16.0
  - @modern-js/e2e@2.16.0

## 2.15.0

### Minor Changes

- 3e5e790: feat(transformImport): support disable default transform import, add more test of transformImport

  feat(transformImport): 支持关闭默认的 transform import，增加更多 transformImport 测试

### Patch Changes

- Updated dependencies [3e5e790]
  - @modern-js/builder-shared@2.15.0
  - @modern-js/babel-preset-app@2.15.0
  - @modern-js/babel-preset-base@2.15.0
  - @modern-js/server@2.15.0
  - @modern-js/e2e@2.15.0
  - @modern-js/types@2.15.0
  - @modern-js/utils@2.15.0

## 2.14.0

### Patch Changes

- bd52693: chore(deps): bump cssnano from v5 to v6

  chore(deps): 将 cssnano 从 v5 升级到 v6

- fefd1c5: feat(builder): add convertToRem.inlineRuntime config

  feat(builder): 新增 convertToRem.inlineRuntime 配置项

- 4baf588: fix(monorepo): ignore unnessary peer deps warning from antd

  fix(monorepo): 忽略由 antd 造成的不必要的 peer deps 警告

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
  - @modern-js/babel-preset-app@2.14.0
  - @modern-js/babel-preset-base@2.14.0
  - @modern-js/e2e@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/builder-shared@2.13.4
- @modern-js/babel-preset-app@2.13.4
- @modern-js/babel-preset-base@2.13.4
- @modern-js/server@2.13.4
- @modern-js/e2e@2.13.4
- @modern-js/types@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- 7b9dc49: fix(builder): set camel2dashName properly

  fix(builder): 正确配置 transformImport babel 插件的 camel2dashName

- Updated dependencies [18cd03f]
- Updated dependencies [28583e8]
  - @modern-js/builder-shared@2.13.3
  - @modern-js/babel-preset-app@2.13.3
  - @modern-js/babel-preset-base@2.13.3
  - @modern-js/server@2.13.3
  - @modern-js/e2e@2.13.3
  - @modern-js/types@2.13.3
  - @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- @modern-js/builder-shared@2.13.2
- @modern-js/babel-preset-app@2.13.2
- @modern-js/babel-preset-base@2.13.2
- @modern-js/server@2.13.2
- @modern-js/e2e@2.13.2
- @modern-js/types@2.13.2
- @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/builder-shared@2.13.1
- @modern-js/babel-preset-app@2.13.1
- @modern-js/babel-preset-base@2.13.1
- @modern-js/server@2.13.1
- @modern-js/e2e@2.13.1
- @modern-js/types@2.13.1
- @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- c89de05: chore(rspack-provider): apply fullySpecified mjs default value in Rspack

  chore(rspack-provider): 在 Rspack 中设置 fullySpecified 在 mjs 下的默认值

- 5deb1fb: chore: bump core-js and swc

  chore: 升级 core-js 和 swc

- 9c0572e: chore(builder): support get builder/shared compiled path in provider getCompiledPath api

  chore(builder): 支持通过 provider getCompiledPath api 获取 builder/shared 中预打包依赖路径

- Updated dependencies [1feacdc]
- Updated dependencies [384406c]
- Updated dependencies [c89de05]
- Updated dependencies [5deb1fb]
- Updated dependencies [348306d]
- Updated dependencies [384e393]
- Updated dependencies [9c0572e]
  - @modern-js/builder-shared@2.13.0
  - @modern-js/babel-preset-app@2.13.0
  - @modern-js/server@2.13.0
  - @modern-js/babel-preset-base@2.13.0
  - @modern-js/e2e@2.13.0
  - @modern-js/types@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- fef3394: fix(builder): should add id prefix after minify SVG

  fix(builder): 压缩 SVG 后需要添加 id 前缀

- 591f53a: chore(deps): bump fork-ts-checker-webpack-plugin to v8

  chore(deps): 升级 fork-ts-checker-webpack-plugin 到 v8

- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
- Updated dependencies [fef3394]
  - @modern-js/utils@2.12.0
  - @modern-js/builder-shared@2.12.0
  - @modern-js/babel-preset-app@2.12.0
  - @modern-js/babel-preset-base@2.12.0
  - @modern-js/server@2.12.0
  - @modern-js/e2e@2.12.0
  - @modern-js/types@2.12.0

## 2.11.0

### Minor Changes

- a8c08c3: feat: 添加 `source.transformImoprt`

  feat: add `source.transformImoprt`

### Patch Changes

- cfb058f: fix(builder): remove duplicated babel-plugin-import

  fix(builder): 移除重复注册的 babel-plugin-import

- a9c6083: fix(builder): incorrect asset URL in windows

  fix(builder): 修复 windows 上生成静态资源 URL 错误的问题

- 55b07fd: feat(builder): support output.assetsRetry in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.assetsRetry 配置能力

- 73cfc9b: fix: 移除 babel plugin-import 对于非法函数参数的校验

  fix: remove babel plugin-import invalid function type options checking

- cd1040f: feat: use generated default config objects instead of global objects
  feat: 默认配置项使用动态生成替代全局对象
- e262a99: fix(builder): failed to set empty distPath.js/css

  fix(builder): 修复设置 distPath.js/css 为空时报错的问题

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
  - @modern-js/babel-preset-base@2.11.0
  - @modern-js/babel-preset-app@2.11.0
  - @modern-js/utils@2.11.0
  - @modern-js/server@2.11.0
  - @modern-js/e2e@2.11.0
  - @modern-js/types@2.11.0

## 2.10.0

### Minor Changes

- a8db932: feat: rspack-provider support tools.babel
  feat: rspack-provider 支持 tools.babel
- 82326ee: feat: `security.checkSyntax` support exclude configuration.
  feat: `security.checkSyntax` 支持 exclude 配置项。

### Patch Changes

- 92d247f: fix: support tools.devServer.header include string[] type, remove get & delete & apply api in hook or middleware api
  fix: 支持 tools.devServer.header 包含字符串数组类型，移除 Hook 和 Middleware 中对 响应 Cookie 的获取、删除操作
- 0d9962b: fix: add types field in package.json
  fix: 添加 package.json 中的 types 字段
- fbefa7e: chore(deps): bump webpack from 5.75.0 to 5.76.2

  chore(deps): 将 webpack 从 5.75.0 升级至 5.76.2

- Updated dependencies [a8db932]
- Updated dependencies [3e0bd50]
- Updated dependencies [92d247f]
- Updated dependencies [0da32d0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/builder-shared@2.10.0
  - @modern-js/babel-preset-app@2.10.0
  - @modern-js/server@2.10.0
  - @modern-js/types@2.10.0
  - @modern-js/utils@2.10.0
  - @modern-js/e2e@2.10.0

## 2.9.0

### Patch Changes

- 7035d5c22f: fix: server worker dynamicImportMode config

  fix: 修复 server worker 时 dynamicImportMode 配置

- Updated dependencies [49bb8cd0ef]
  - @modern-js/server@2.9.0
  - @modern-js/builder-shared@2.9.0
  - @modern-js/babel-preset-app@2.9.0
  - @modern-js/e2e@2.9.0
  - @modern-js/types@2.9.0
  - @modern-js/utils@2.9.0

## 2.8.0

### Patch Changes

- 65c56f43b9: fix(builder): missing some type in tools.cssExtract

  fix(builder): 修复 tools.cssExtract 缺少部分类型的问题

- 2c1151271d: fix(builder): fix incorrect browserslist config

  fix(builder): 修复错误的 browserslist 配置

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
  - @modern-js/babel-preset-app@2.8.0
  - @modern-js/e2e@2.8.0

## 2.7.0

### Patch Changes

- 206c806efa: fix(rspack-provider): missing tools.autoprefixer type

  fix(rspack-provider): 修复缺少 tools.autoprefixer 类型定义的问题

- a729b0d366: fix(builder): tools.sass type should use legacy sass options by default

  fix(builder): tools.sass 默认使用 legacy sass 选项类型

- 5f899af53a: feat(builder): support output.enableAssetFallback in rspack-provider

  feat(builder): 在 rspack-provider 中支持 output.enableAssetFallback 配置项

- 7fff9020e1: chore: make file naming consistent

  chore: 统一文件命名为小驼峰格式

- 1eea234fdd: chore: make test files naming consistent

  chore: 统一测试文件命名为小驼峰格式

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
  - @modern-js/babel-preset-app@2.7.0
  - @modern-js/e2e@2.7.0

## 2.6.0

### Minor Changes

- fae9d1b: feat(builder): support import .wasm assets

  feat(builder): 支持引用 .wasm 资源

### Patch Changes

- 671477d: chore(CI): make CI faster

  chore(CI): 提升 CI 执行速度

- 1c76d0e: fix: adjust @babel/core to dependencies instead of devDependencies.
  fix: 调整 `@babel/core` 为 `dependencies` 而不是 `devDependencies`.
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
  - @modern-js/babel-preset-app@2.6.0
  - @modern-js/e2e@2.6.0

## 2.5.0

### Minor Changes

- 28e7dc6: feat: more use bunlder chain to modify bundler config
  feat: 更多的使用 `bunlder chain` 去修改 bunlder 配置

### Patch Changes

- 30614fa: chore: modify package.json entry fields and build config
  chore: 更改 package.json entry 字段以及构建配置
- 038a23b: feat(builder): reduce recompile logs
  feat(builder): 减少 recompile 日志数量
- c4c10e7: refactor: refactor rules for static assets processing with rule.oneOf, reuse svg/font/image/media plugin

  refactor: 使用 oneOf 重构静态资源处理规则 & 复用 svg / font / media / img 插件

- 1b0ce87: chore: bump caniuse-lite to latest version

  chore: 升级 caniuse-lite 到最新版

- 11c053b: feat: ssr support deploy worker

  feat: ssr 支持边缘部署

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
  - @modern-js/babel-preset-app@2.5.0
  - @modern-js/server@2.5.0
  - @modern-js/types@2.5.0
  - @modern-js/utils@2.5.0
  - @modern-js/e2e@2.5.0

## 2.4.0

### Minor Changes

- a5572b8: feat: more plugin rebase in `builder-shared`
  feat: 更多 plugin 下沉到 `builder-shared`

### Patch Changes

- 637f16b: fix(builder): incorrect progress bar color when compile failed

  fix(builder): 修复编译错误时进度条颜色错误的问题

- 6f83037: fix: change the builder resolve plugin
  fix: 修复 builder resolve 插件
- 014d06b: feat: reuse bundleAnalyzer plugin, support performance.bundleAnalyze config in rspack-provider

  feat: 复用 bundleAnalyzer 插件，在 rspack-provider 中支持 performance.bundleAnalyze 配置项

- b3f2a7e: fix(builder): increase size limit when target is node

  fix(builder): 修复 target 为 node 时体积限制过小的问题

- 67b5a42: perf(builder): improve styled-components compile speed

  perf(builder): 优化 styled-components 编译速度

- 48b036e: fix(builder): should not generate cache when build failed

  fix(builder): 修复构建失败时会生成无效编译缓存的问题

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
  - @modern-js/babel-preset-app@2.4.0
  - @modern-js/e2e@2.4.0
  - @modern-js/types@2.4.0

## 2.3.0

### Minor Changes

- f9a26fe: fix(@modern-js/builder-shared): openBrowser add openChrome.applescript script

  fix(@modern-js/builder-shared): openBrowser 添加 openChrome.applescript 脚本

- b6c2eb8: feat: add builder check syntax plugin
  feat: 新增 builder 兼容语法检测插件

### Patch Changes

- 7cd8185: chore: reuse splitChunks plugin between rspack-provider and webpack-provider

  chore: 在 rspack-provider 和 webpack-provider 间复用 splitChunks plugin

- 362c9a8: feat(builder): improve succeed and failed progress log

  feat(builder): 优化编译成功或失败时的进度条效果

- 67ba34a: chore(builder): remove unused ajv schema types

  chore(builder): 移除过时的 ajv 相关类型

- 1b0dd35: feat: plugin define accept `undefined`

  feat: define 插件的选项允许接受 `undefined`

- 01e4a27: feat(builder): improve error logs of syntax checker

  feat(builder): 优化 syntax 检查的错误日志

- 3cdf48e: fix(builder): should not emit async chunk when target is web-worker

  fix(builder): 修复 target 为 web-worker 时产物中出现 async chunk 的问题

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
  - @modern-js/babel-preset-app@2.3.0
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
  - @modern-js/babel-preset-app@2.2.0
  - @modern-js/e2e@2.2.0

## 2.1.0

### Minor Changes

- 8a9482c: feat(builder): add new option `html.tags` & `html.tagsByEntries`

  feat(builder): 添加新的配置项 `html.tags` 和 `html.tagsByEntries`

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
  - @modern-js/babel-preset-app@2.1.0
  - @modern-js/utils@2.1.0
  - @modern-js/server@2.1.0
  - @modern-js/builder-shared@2.1.0
  - @modern-js/e2e@2.1.0
  - @modern-js/types@2.1.0

## 2.0.0

### Major Changes

Initial Release
