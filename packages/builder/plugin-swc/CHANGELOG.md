# @modern-js/builder-plugin-swc

## 2.7.0

### Patch Changes

- bf5cd628f5: fix: should pass extensions option to loader

  fix: extensions 配置应该传给 loader

- 43f1091819: fix(plugin-swc): webpack magic comment is removed after compilation

  fix(plugin-swc): 修复 webpack magic comment 被错误移除的问题

- 3a942a2472: feat: add Rspack provider swc options, add builder-plugin-swc overrideBrowserslist configuration, report warning when enable latestDecorator in builder-plugin-swc

  feat: 给 Rspack provider 增加 swc 相关配置项，增加 builder-plugin-swc overrideBrowserslist 配置，在 builder-plugin-swc 启用 latestDecorator 后增加 warning 报错

- 9d4da8687a: fix: disable swc react refresh when ssr mode.
  fix: 当在 SSR 模式时，禁用 swc react refresh.
- 65c5ff6042: fix(plugin-swc): runtime error when set dev.hmr to false

  fix(plugin-swc): 修复 dev.hmr 设置为 false 时出现运行时错误的问题

- Updated dependencies [0f15fc597c]
- Updated dependencies [dcad887024]
- Updated dependencies [a4672f7c16]
- Updated dependencies [7fff9020e1]
- Updated dependencies [84bfb439b8]
  - @modern-js/utils@2.7.0

## 2.6.0

### Patch Changes

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

- b18a544: fix(builder-plugin-swc): properly handle transform error in loader

  fix(builder-plugin-swc): 处理 loader 中的编译异常

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

- e787a45: feat: Add config to enable legacy decorator and 2 css-in-js plugins, update swc version

  feat: 以及 2 个 css-in-js 插件，升级 swc 版本

- Updated dependencies [6f83037]
- Updated dependencies [014d06b]
- Updated dependencies [98a2733]
- Updated dependencies [a5572b8]
- Updated dependencies [a914be8]
- Updated dependencies [8c2db5f]
  - @modern-js/builder-shared@2.4.0
  - @modern-js/utils@2.4.0

## 2.3.0

### Patch Changes

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

- 16bdc0a: chore: adjust builder plugin name

  chore: 调整 builder 插件命名格式

- Updated dependencies [f2f8a83]
- Updated dependencies [49eff0c]
  - @modern-js/builder-shared@2.2.0
  - @modern-js/utils@2.2.0

## 2.1.0

### Patch Changes

- 837620c: fix: Disable detect tsconfig.json
  fix: 禁用探测 tsconfig.json
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
