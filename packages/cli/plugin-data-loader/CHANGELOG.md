# @modern-js/plugin-data-loader

## 2.24.1

### Patch Changes

- @modern-js/utils@2.24.1

## 2.24.0

### Patch Changes

- 4a82c3b: fix: export `@remix-run/router` cjs instead of `react-router-dom`
  fix: 暴露 `@remix-run/router` 的 cjs 导出代替 `react-router-dom`
- Updated dependencies [c882fbd]
- Updated dependencies [4a82c3b]
  - @modern-js/utils@2.24.0

## 2.23.1

### Patch Changes

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1

## 2.23.0

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- a7a7ad7: chore: move some public code to the utils package
  chore: 移动一些公共的代码到 utils 包
- 6dec7c2: test(utils): reuse the snapshot serializer of vitest config

  test(utils): 复用 vitest 的 snapshot serializer

- e5259fb: fix: absoluteEntryDir should support directory entry
  fix: absoluteEntryDir 应该支持配置目录 entry，这里 document 会使用
- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [6dec7c2]
- Updated dependencies [c3216b5]
  - @modern-js/utils@2.23.0

## 2.22.1

### Patch Changes

- Updated dependencies [e2848a2]
- Updated dependencies [d4045ed]
  - @modern-js/utils@2.22.1

## 2.22.0

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- Updated dependencies [3d48836]
- Updated dependencies [5050e8e]
  - @modern-js/utils@2.22.0

## 2.21.1

### Patch Changes

- @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- e81eeaf: refactor: guard react-router version consistency
  refactor: 保证 react-router 相关包的版本一致性
- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- ad78387: chore(deps): bump babel-related dependencies to latest version

  chore(deps): 升级 babel 相关依赖到最新版本

- Updated dependencies [e81eeaf]
- Updated dependencies [26dcf3a]
- Updated dependencies [056627f]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/utils@2.21.0

## 2.20.0

### Patch Changes

- 6b9d90a: chore: remove @babel/runtime. add @swc/helper and enable `externalHelper` config.
  chore: 移除 @babel/runtime 依赖. 增加 @swc/helpers 依赖并且开启 `externalHelpers` 配置
- Updated dependencies [3c4e0a5]
- Updated dependencies [6b9d90a]
  - @modern-js/utils@2.20.0

## 2.19.1

### Patch Changes

- @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- 1134fe2: chore(deps): bump webpack from 5.76.2 to 5.82.1

  chore(deps): 将 webpack 从 5.76.2 升级至 5.82.1

- Updated dependencies [1134fe2]
  - @modern-js/utils@2.19.0

## 2.18.1

### Patch Changes

- @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- @modern-js/utils@2.17.1

## 2.17.0

### Patch Changes

- @modern-js/utils@2.17.0

## 2.16.0

### Patch Changes

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- Updated dependencies [5954330]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
  - @modern-js/utils@2.16.0

## 2.15.0

### Patch Changes

- @modern-js/utils@2.15.0

## 2.14.0

### Patch Changes

- d05651a: fix: set encoding for defered loader
  fix: 为 defer loader 设置 encoding
- Updated dependencies [4779152]
- Updated dependencies [9321bef]
- Updated dependencies [9b45c58]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/utils@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/utils@2.13.1

## 2.13.0

### Minor Changes

- 3d5086b: feat: the rspack unsupport inline loader, so we move data-loader to bundler.module.rules
  feat: rspack 不支持 inline loader, 所以我们将 data-loader 移动到 bundler.module.rules 配置中去。

### Patch Changes

- @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
  - @modern-js/utils@2.12.0

## 2.11.0

### Patch Changes

- 5d624fd: feat: assets and data prefetching is supported
  feat: 支持资源和数据预加载
- e2466a1: fix: remove nestedRoutes file from @modern-js/utils
  fix: 将 nestedRoutes 从 @modern-js/utils 中移除
- 381a3b9: feat(utils): move universal utils to the universal folder

  feat(utils): 将运行时使用的 utils 移动到 universal 目录

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

## 2.10.0

### Patch Changes

- 3e0bd50: feat: when enable bff handle render, support use `useContext` to get framework plugin context in data loader.
  feat: 当开启 BFF 托管渲染时，支持在 data loader 中使用 `useContext` 获取框架插件提供的上下文。
- 0da32d0: chore: upgrade jest and puppeteer
  chore: 升级 jest 和 puppeteer 到 latest
- 0d9962b: fix: add types field in package.json
  fix: 添加 package.json 中的 types 字段
- fbefa7e: chore(deps): bump webpack from 5.75.0 to 5.76.2

  chore(deps): 将 webpack 从 5.75.0 升级至 5.76.2

- d6b6e29: fix: split server and runtime code in plugin-data-loader
  fix: 分离 plugin-data-loader 中服务端和客户端运行时的代码
- Updated dependencies [0da32d0]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
  - @modern-js/utils@2.10.0

## 2.9.0

### Patch Changes

- @modern-js/utils@2.9.0

## 2.8.0

### Patch Changes

- 0cf8540ffe: fix: should match the most similar entry
  fix: 应该匹配最相似的 entry
- Updated dependencies [1104a9f18b]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/utils@2.8.0
