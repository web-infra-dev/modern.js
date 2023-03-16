# @modern-js/builder

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
