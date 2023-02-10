# @modern-js/builder-webpack-provider

## 2.5.0-beta.0

### Minor Changes

- 28e7dc6: feat: more use bunlder chain to modify bundler config
  feat: 更多的使用 `bunlder chain` 去修改 bunlder 配置

### Patch Changes

- c4c10e7: refactor: refactor rules for static assets processing with rule.oneOf, reuse svg/font/image/media plugin

  refactor: 使用 oneOf 重构静态资源处理规则 & 复用 svg / font / media / img 插件

- 11c053b: feat: ssr support deploy worker

  feat: ssr 支持边缘部署

- Updated dependencies [c4c10e7]
- Updated dependencies [11c053b]
- Updated dependencies [28e7dc6]
  - @modern-js/builder-shared@2.5.0-beta.0
  - @modern-js/utils@2.4.1-beta.0
  - @modern-js/server@2.4.1-beta.0
  - @modern-js/babel-preset-app@2.4.1-beta.0
  - @modern-js/e2e@2.4.1-beta.0

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
