# @modern-js/builder-shared

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
- a914be8: feat: modern-js support rspack bundler
  feat: modern-js 支持 rspack 构建工具

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
