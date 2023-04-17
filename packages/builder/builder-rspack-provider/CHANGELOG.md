# @modern-js/builder-rspack-provider

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
