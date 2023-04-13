# @modern-js/builder-plugin-swc

## 2.13.0

### Patch Changes

- 5deb1fb: chore: bump core-js and swc

  chore: 升级 core-js 和 swc

- Updated dependencies [1feacdc]
- Updated dependencies [384406c]
- Updated dependencies [c89de05]
- Updated dependencies [d69c0b9]
- Updated dependencies [5deb1fb]
- Updated dependencies [348306d]
- Updated dependencies [384e393]
- Updated dependencies [9c0572e]
- Updated dependencies [67a235b]
  - @modern-js/builder-shared@2.13.0
  - @modern-js/builder-plugin-swc-base@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- Updated dependencies [c2ca6c8]
- Updated dependencies [98f8cb6]
- Updated dependencies [6d86e34]
- Updated dependencies [fef3394]
  - @modern-js/utils@2.12.0
  - @modern-js/builder-plugin-swc-base@2.12.0
  - @modern-js/builder-shared@2.12.0

## 2.11.0

### Minor Changes

- c6a94c7: feat: sink builder-plugin-swc abilities to `builder-plugin-swc-base`.
  feat: 将 builder-plugin-swc 能力下沉到 builder-plugin-swc-base 里.

### Patch Changes

- a8c08c3: feat: 添加 `source.transformImoprt`

  feat: add `source.transformImoprt`

- 99693f0: fix: the swc compiler can not create two different options instance && move default config to swc-base
  fix: swc 转译器无法创建两个不同配置的实体 && 将默认配置移到 swc-base
- Updated dependencies [adcedad]
- Updated dependencies [cfb058f]
- Updated dependencies [a9c6083]
- Updated dependencies [55b07fd]
- Updated dependencies [0bd018b]
- Updated dependencies [c6a94c7]
- Updated dependencies [8b90c79]
- Updated dependencies [a8c08c3]
- Updated dependencies [3aa318d]
- Updated dependencies [5d624fd]
- Updated dependencies [e2466a1]
- Updated dependencies [53b0a63]
- Updated dependencies [02bb383]
- Updated dependencies [381a3b9]
- Updated dependencies [99693f0]
- Updated dependencies [7a60f10]
- Updated dependencies [cd1040f]
- Updated dependencies [e262a99]
- Updated dependencies [b71cef1]
- Updated dependencies [274b2e5]
- Updated dependencies [b9e1c54]
  - @modern-js/builder-shared@2.11.0
  - @modern-js/utils@2.11.0
  - @modern-js/builder-plugin-swc-base@2.11.0

## 2.10.0

### Patch Changes

- fbefa7e: chore(deps): bump webpack from 5.75.0 to 5.76.2

  chore(deps): 将 webpack 从 5.75.0 升级至 5.76.2

- Updated dependencies [a8db932]
- Updated dependencies [92d247f]
- Updated dependencies [0da32d0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/builder-shared@2.10.0
  - @modern-js/utils@2.10.0

## 2.9.0

### Patch Changes

- @modern-js/builder-shared@2.9.0
- @modern-js/utils@2.9.0

## 2.8.0

### Minor Changes

- 9736c6a43d: feat: enable swc css minify

  feat: 启用 swc css 压缩

### Patch Changes

- 2c1151271d: fix(builder): fix incorrect browserslist config

  fix(builder): 修复错误的 browserslist 配置

- 6379f52a89: fix(builder-plugin-swc): should handle object type sourceMap correctly

  fix(builder-plugin-swc): 正确处理 loader 接收的对象类型 sourceMap

- dd40c95411: fix(builder-plugin-swc): should not override user react runtime

  fix(builder-plugin-swc): 不应该覆盖用户 react runtime 配置

- 05d485286c: test(builder-plugin-swc): add test for builder-plugin-swc loader

  test(builder-plugin-swc): 添加 builder-plugin-swc 的 loader 测试

- 186e029330: fix(plugin-swc): missing @modern-js/builder-shared dependency

  fix(plugin-swc): 修复缺少 @modern-js/builder-shared 依赖的问题

- Updated dependencies [bd369a89a4]
- Updated dependencies [1104a9f18b]
- Updated dependencies [2c1151271d]
- Updated dependencies [481461a61d]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/builder-shared@2.8.0
  - @modern-js/utils@2.8.0

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
