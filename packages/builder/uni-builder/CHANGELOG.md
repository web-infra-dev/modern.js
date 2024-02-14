# @modern-js/uni-builder

## 2.47.0

### Patch Changes

- 0448ebd: fix(uni-builder): deepmerge cause plugin apply undefined

  fix(uni-builder): deepmerge 导致 webpack apply 方法丢失

- eec5792: fix(uni-builder): apply babel preset-react when using ts-loader

  fix(uni-builder): 使用 ts-loader 时开启 babel preset-react

- b79abcf: fix(uni-builder): styled-components not works when use webpack swc-plugin

  fix(uni-builder): 修复在使用 webpack swc 插件时 styled-components 不生效的问题

- 244745f: fix(uni-builder): repeatedly insert babel plugin when using tsLoader in some edge case

  fix(uni-builder): 修复在一些边界场景下使用 tsLoader 时会重复添加 babel plugin 的问题

- ed13533: fix(uni-builder): missing css sourcemap when dev

  fix(uni-builder): dev 构建时缺失 css sourcemap

- Updated dependencies [b68c12a]
- Updated dependencies [a9a3626]
- Updated dependencies [01b75e6]
  - @modern-js/prod-server@2.47.0
  - @modern-js/server@2.47.0
  - @modern-js/utils@2.47.0

## 2.46.1

### Patch Changes

- 26cdc77: fix(uni-builder): should print https url when enable dev.https

  fix(uni-builder): 应该打印 https url 当开启 dev.https 时

- 875d5dd: fix(uni-builder): tools.devServer client options not works

  fix(uni-builder): 修复 tools.devServer client 配置项不生效问题

- 1e81b5a: fix(uni-builder): disable default publicDir

  fix(uni-builder): 默认禁用 publicDir

  - @modern-js/prod-server@2.46.1
  - @modern-js/server@2.46.1
  - @modern-js/utils@2.46.1

## 2.46.0

### Minor Changes

- 4699e22: feat: bump Rsbuild 0.3.3 and Rspack 0.5.0

  feat: 升级 Rsbuild 0.3.3 和 Rspack 0.5.0

### Patch Changes

- f6b0e59: feat(uni-builder): support passing source build options

  feat(uni-builder): 支持传入 source build 配置项

- cac5e16: fix(uni-builder): make the plugins type looser to avoid type mismatch

  fix(uni-builder): 使用更松散的 plugins 类型来避免 type 不匹配的问题

- 4699e22: chore: explicitly declare Node version of babel target

  chore: 显式声明 babel 的目标 Node 版本

- Updated dependencies [091c7c2]
- Updated dependencies [d833015]
- Updated dependencies [46e6d56]
- Updated dependencies [494b290]
  - @modern-js/prod-server@2.46.0
  - @modern-js/server@2.46.0
  - @modern-js/utils@2.46.0

## 2.45.0

### Patch Changes

- 783dd96: chore(deps): bump rsbuild to 0.2.15

  chore(deps): 升级 rsbuild 到 0.2.15

- Updated dependencies [f50ad3e]
  - @modern-js/prod-server@2.45.0
  - @modern-js/server@2.45.0
  - @modern-js/utils@2.45.0

## 2.44.0

### Patch Changes

- bfe1347: chore(deps): bump rsbuild to 0.2.8 and use html-webpack-plugin in uni-builder webpack mode

  chore(deps): 升级 rsbuild 到 0.2.8，在 uni-builder webpack 模式下使用 html-webpack-plugin

- Updated dependencies [0ed968c]
- Updated dependencies [2b41e70]
- Updated dependencies [56d7f9a]
  - @modern-js/prod-server@2.44.0
  - @modern-js/server@2.44.0
  - @modern-js/utils@2.44.0

## 2.43.0

### Patch Changes

- 3067256: chore: bump rsbuild to 0.2.7

  chore: 升级 rsbuild 到 0.2.7

- 03a3196: feat(uni-builder): add unified builder for Modern.js

  feat(uni-builder): 添加从原 modern.js builder 到 Rsbuild 的转换层

- 66fca4e: feat(uni-builder): integrate modern server into startDevServer

  feat(uni-builder): 将 modern server 集成到 startDevServer 中

- Updated dependencies [9e749d8]
- Updated dependencies [d959200]
- Updated dependencies [acd3861]
- Updated dependencies [5782aa3]
  - @modern-js/server@2.43.0
  - @modern-js/prod-server@2.43.0
  - @modern-js/utils@2.43.0
