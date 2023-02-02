# @modern-js/builder-shared

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
