# @modern-js/builder-doc

## 2.49.3

## 2.49.2

## 2.49.1

### Patch Changes

- bfba084: docs: bump Rspress v1.18.2 and remove dividers

## 2.49.0

## 2.48.6

## 2.48.5

## 2.48.4

### Patch Changes

- f11abf7: docs: fix dead link in source.alias

## 2.48.3

## 2.48.2

## 2.48.1

## 2.48.0

## 2.47.1

## 2.47.0

### Patch Changes

- 42cc427: chore(builder-cli): builder-cli is no longer maintained, please use rsbuild instead

  chore(builder-cli): builder-cli 不再维护, 可使用 rsbuild 代替

- 52185fc: chore(plugin-vue): builder vue & vue2 plugin is no longer maintained, please use rsbuild instead

  chore(plugin-vue): builder vue & vue2 插件不再维护, 请使用 rsbuild 代替

## 2.46.1

## 2.46.0

### Patch Changes

- 6bc042d: chore: remove tools.inspector api, please use rsdoctor instead

  chore: 移除 tools.inspector api, 可使用 rsdoctor 代替

## 2.45.0

## 2.44.0

## 2.43.0

### Patch Changes

- 4b4d08a: chore: remove Rsbuild unsupported CHAIN_ID

  chore: 移除在 Rsbuild 中不支持的 CHAIN_ID

## 2.42.2

## 2.42.1

### Patch Changes

- 7d327e5: docs: change builderCofnig to builderConfig

## 2.42.0

### Patch Changes

- e8d838c: fix: update storybook doc file extension
  fix: 更新 Storybook 文档后缀
- 6434114: fix: change storybook doc file extension
  fix: 修改 Storybook 文档文件后缀

## 2.41.0

### Patch Changes

- 3164aad: chore(storybook): enhance docs and auto detect builder provider

  chore(storybook): 改进文档，自动判断的 builder provider

## 2.40.0

### Patch Changes

- 477f18d: doc(builder-doc): add version tip for sourceBuild api
  doc(builder-doc): 为 sourceBuild API 添加版本提示信息

## 2.39.2

## 2.39.1

## 2.39.0

## 2.38.0

## 2.37.2

## 2.37.1

## 2.37.0

### Patch Changes

- 21c0976: fix: correct content about disableHtmlFolder API
  fix: 更正 disableHtmlFolder API 的内容

## 2.36.0

## 2.35.1

### Patch Changes

- ea3fe18: feat(app-tools): make logs easier to read

  feat(app-tools): 让日志更容易阅读

## 2.35.0

## 2.34.0

## 2.33.1

## 2.33.0

## 2.32.1

## 2.32.0

### Patch Changes

- 0cc3981: chore(builder): use standard utils to get and make up publicPath

  chore(builder): 使用标准的 utils 来读取和组装 publicPath

## 2.31.2

## 2.31.1

## 2.31.0

## 2.30.0

### Patch Changes

- cc5f49e: feat(builder): add performance.transformLodash config

  feat(builder): 新增 performance.transformLodash 配置

## 2.29.0

## 2.28.0

## 2.27.0

### Patch Changes

- 86274f5: docs: add source code build documentation
  docs: 添加源码构建文档

## 2.26.0

## 2.25.2

## 2.25.1

## 2.25.0

## 2.24.0

## 2.23.1

### Patch Changes

- 4d4dca0: feat(builder): add new plugin.remove option

  feat(builder): 新增 plugin.remove 选项

## 2.23.0

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- 692cc0e: fix(builder): assetsRetry.crossOrigin default to html.crossorigin

  fix(builder): assetsRetry.crossOrigin 默认值与 html.crossorigin 保持一致

## 2.22.1

### Patch Changes

- bd4b150: feat(builder): add builder.serve method

  feat(builder): 新增 builder.serve 方法

- 2ede584: docs(main): update start doc

  docs(main): 更新开始文档

## 2.22.0

### Patch Changes

- 850cde6: feat(builder): add arco config to transformImport by default

  feat(builder): 默认增加 arco 的 transformImport 配置

- e7a5f94: feat(plugin-swc): should reduce lodash bundle size by default

  feat(plugin-swc): 默认优化 lodash 包体积

## 2.21.1

## 2.21.0

### Patch Changes

- 1ef03dc: feat(dev-server): enable gzip compression, add devServer.compress config

  feat(dev-server): 默认启用 gzip 压缩，新增 devServer.compress 配置项

## 2.20.0

## 2.19.1

## 2.19.0

## 2.18.1

## 2.18.0

## 2.17.1

## 2.17.0

## 2.16.0

### Patch Changes

- fe92de6: fix(builder): browserslist config should not affect node bundles

  fix(builder): 修复 browserslist 配置会对 node 产物生效的问题

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

## 2.15.0

## 2.14.0

### Patch Changes

- fefd1c5: feat(builder): add convertToRem.inlineRuntime config

  feat(builder): 新增 convertToRem.inlineRuntime 配置项

- 1f34dba: fix(devServer): using current host and port to create HMR connection

  fix(devServer): 建立 HMR 连接时默认使用当前 host 和 port

- b965df2: fix(builder): update source.alias type when using Rspack

  fix(builder): 更新使用 Rspack 时的 source.alias 类型

## 2.13.4

## 2.13.3

### Patch Changes

- 28583e8: feat(builder): add assetsRetry.inlineScript config

  feat(builder): 新增 assetsRetry.inlineScript 配置项

## 2.13.2

## 2.13.1

## 2.13.0

### Patch Changes

- 1feacdc: feat(builder): support using RegExp to inline part of chunks

  feat(builder): 支持通过正则来内联部分资源

- 348306d: feat(builder): add html.scriptLoading config

  feat(builder): 新增 html.scriptLoading 配置

- 42700c1: chore: improve ssr docs, add more use case for node/web code split
  chore: 优化 ssr 文档，为 node/web 代码分割添加更多使用场景

## 2.12.0

## 2.11.0

### Patch Changes

- a8c08c3: feat: 添加 `source.transformImoprt`

  feat: add `source.transformImoprt`

- b71cef1: feat(builder): support setting forceSplitting to be an object

  feat(builder): 支持将 forceSplitting 设置为一个对象

## 2.10.0

### Patch Changes

- cfdbf80: fix(builder): update source.define type and schema check in rspack-provider

  fix(builder): 更新 rspack-provider 中 source.define 的类型定义与校验

## 2.9.0

## 2.8.0

### Minor Changes

- 9736c6a43d: feat: enable swc css minify

  feat: 启用 swc css 压缩

### Patch Changes

- 2c1151271d: fix(builder): fix incorrect browserslist config

  fix(builder): 修复错误的 browserslist 配置

## 2.7.0

### Patch Changes

- 54caf43349: fix: performance.chunkSplit.strategy position

  fix: 修复 performance.chunkSplit.strategy 位置错误

## 2.6.0

### Minor Changes

- fae9d1b: feat(builder): support import .wasm assets

  feat(builder): 支持引用 .wasm 资源

### Patch Changes

- 88f7b34: fix(app-tools): incorrect tools.esbuild config

  fix(app-tools): 修复 tools.esbuild 格式与文档不一致的问题

- 107f674: feat(builder): add dev.beforeStartUrl config

  feat(builder): 新增 dev.beforeStartUrl 配置项

## 2.5.0

### Patch Changes

- c5ea222: feat(builder): support mergeConfig util in tools.webpack

  feat(builder): 支持在 tools.webpack 中使用 mergeConfig 工具函数

- 138a6b5: chore: update README and description of module-tools packages

  chore: 更新 module-tools 相关包的 README 和 description

## 2.4.0

### Patch Changes

- dfdd35a: docs: make v2 docs as default

  docs: 将 Modern.js v2 文档作为默认文档

- e787a45: feat: Add config to enable legacy decorator and 2 css-in-js plugins, update swc version

  feat: 以及 2 个 css-in-js 插件，升级 swc 版本

- ddc326a: feat: flatten mdx content

  feat: 对 mdx 的内容进行扁平化

## 2.3.0

### Patch Changes

- 01e4a27: feat(builder): improve error logs of syntax checker

  feat(builder): 优化 syntax 检查的错误日志

## 2.2.0

### Patch Changes

- d82b621: feat(builder): support port placeholder in dev.startUrl config

  feat(builder): 支持在 dev.startUrl 配置项中使用端口号占位符

- 9da67a2: docs(Builder): fix some keyword is replaced incorrectly

  docs(Builder): 修复个别关键词被错误替换的问题

- 16bdc0a: chore: adjust builder plugin name

  chore: 调整 builder 插件命名格式

## 2.1.0

### Minor Changes

- 8a9482c: feat(builder): add new option `html.tags` & `html.tagsByEntries`

  feat(builder): 添加新的配置项 `html.tags` 和 `html.tagsByEntries`

### Patch Changes

- 32b14f8: fix: fix doc description

  fix: 修复文档描述

- 837620c: fix: Disable detect tsconfig.json
  fix: 禁用探测 tsconfig.json
- 5b54418: fix(builder): no longer remove comments of HTML

  fix(builder): 不再默认移除 HTML 中的注释

- 6efa881: feat(doc-core): append main title as a suffix

  feat(doc-core): 将站点名称作为页面标题的后缀

## 2.0.0

### Major Changes

Initial Release
