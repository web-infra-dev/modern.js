# @modern-js/plugin-garfish

## 3.0.0-next.0

### Patch Changes

- Updated dependencies [7a25271]
- Updated dependencies [11c053b]
- Updated dependencies [a0f2ab1]
  - @modern-js/runtime@3.0.0-next.0
  - @modern-js/utils@3.0.0-next.0

## 2.4.0

### Patch Changes

- b55f8c6: fix(garfish): load microApp can not match it's route
  fix(garfish): server.baseUrl is in preference to router.basename

  修复微前端模式下约定式路由和自控式路由子应用无法正确加载问题
  修复 basename 优先级问题 server.baseUrl 高于 router.basename

- 8c2db5f: feat(core): improve support for exporting a function in config file

  feat(core): 完善对配置文件中导出函数的支持

- Updated dependencies [98a2733]
- Updated dependencies [9e907ec]
- Updated dependencies [8c2db5f]
  - @modern-js/utils@2.4.0
  - @modern-js/runtime@2.4.0

## 2.3.0

### Patch Changes

- f7e90a9: fix: use pluginName instead of a steady name
  修复 garfish 插件导出名称固定导致依赖找不到的问题
- b4dd017: feat: runtime package use treeshaking production for ssr bundle
  feat: runtime 包使用 treeshaking 产物作为 ssr bundle 打包入口
- Updated dependencies [fd5a3ed]
- Updated dependencies [6ca1c0b]
- Updated dependencies [89b6739]
- Updated dependencies [b4dd017]
  - @modern-js/utils@2.3.0
  - @modern-js/runtime@2.3.0

## 2.2.0

### Patch Changes

- cb12ee7: chore: remove some unused deps, bump postcss version

  chore: 移除未使用的依赖, 升级 postcss 版本

- 142efe3: fix(plugin-garfish): fix sub app import garfish runtime
  fix(plugin-garfish): 修复微前端子应用引入了 Garfish Runtime
- Updated dependencies [49eff0c]
- Updated dependencies [f7a1c1f]
  - @modern-js/utils@2.2.0
  - @modern-js/runtime@2.2.0

## 2.1.0

### Patch Changes

- Updated dependencies [f3237db]
- Updated dependencies [837620c]
- Updated dependencies [776cc27]
- Updated dependencies [35d3e84]
- Updated dependencies [8a9482c]
  - @modern-js/runtime@2.1.0
  - @modern-js/utils@2.1.0

## 2.0.2

### Patch Changes

- Updated dependencies [39988b2]
  - @modern-js/runtime@2.0.2
  - @modern-js/utils@2.0.2

## 2.0.1

### Patch Changes

- @modern-js/runtime@2.0.1
- @modern-js/utils@2.0.1

## 2.0.0

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 6bc7763: fix(plugin-garfish): 修复 assetPrefix 用户配置被 plugin-garfish 覆盖问题,自定义入口未正确传递节点参数
  fix(plugin-garfish): Fix the problem that the assetPrefix user configuration is overwritten by plugin-garfish, and the custom entry does not pass the node parameters correctly
- 81b54f9: fix: garfish wrapped app missing props
  fix: garfish 包装过的 APP 缺少 props
- Updated dependencies [c9e800d39a]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [6bda14ed71]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [ffb2ed4]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/runtime@2.0.0
  - @modern-js/utils@2.0.0

## 2.0.0-beta.7

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- Updated dependencies [c9e800d39a]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [6bda14ed71]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [bbe4c4ab64]
  - @modern-js/runtime@2.0.0-beta.7
  - @modern-js/utils@2.0.0-beta.7

## 2.0.0-beta.6

### Major Changes

- dda38c9c3e: chore: v2

### Minor Changes

- df7ee2d: feat: runtime user config types extends
  feat: runtime 用户配置类型扩展

### Patch Changes

- 6604f1b8b3: feat: support router basename
  feat: router 插件支持设置 basename
- 21d2ddb59c: feat: support async export provider for module federation
  支持模块联邦场景异步导出 provider
- cce8ecee2d: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- 2344eb26ed: fix: loadApp when dom is mount
  修复 dom 未渲染时挂载子应用行为
- Updated dependencies [2344eb26ed]
- Updated dependencies [a11fcf8b50]
- Updated dependencies [a93159440e]
- Updated dependencies [e7ce0636d1]
- Updated dependencies [b18fa8f3ed]
- Updated dependencies [7879e8f711]
- Updated dependencies [50d4675e5b]
- Updated dependencies [c9e800d39a]
- Updated dependencies [6604f1b8b3]
- Updated dependencies [6aca875011]
- Updated dependencies [fda836fe8a]
- Updated dependencies [d6bc321747]
- Updated dependencies [3e57f2bd58]
- Updated dependencies [2e6031955e]
- Updated dependencies [c5798d284f]
- Updated dependencies [fbf5eed5aa]
- Updated dependencies [a2509bfbdb]
- Updated dependencies [a7c68832b3]
- Updated dependencies [425e57092d]
- Updated dependencies [e4357f1856]
- Updated dependencies [7b7d12cf8f]
- Updated dependencies [4369648ae2]
- Updated dependencies [7efeed4]
- Updated dependencies [92f0eade39]
- Updated dependencies [df7ee2d]
- Updated dependencies [92c0994468]
- Updated dependencies [2cc2eb35ba]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [60d5378632]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [21d7521]
- Updated dependencies [9144c21d27]
- Updated dependencies [b710adb843]
- Updated dependencies [18aaf42249]
- Updated dependencies [34702d5d47]
- Updated dependencies [fcace5b5b9]
- Updated dependencies [ea7cf06257]
- Updated dependencies [bbe4c4ab64]
- Updated dependencies [e4558a0bc4]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/runtime@2.0.0-beta.6
  - @modern-js/utils@2.0.0-beta.6

## 2.0.0-beta.4

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 6604f1b: feat: support router basename
  feat: router 插件支持设置 basename
- 21d2ddb59c: feat: support async export provider for module federation
  支持模块联邦场景异步导出 provider
- cce8ecee2d: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- 2344eb26ed: fix: loadApp when dom is mount
  修复 dom 未渲染时挂载子应用行为
- Updated dependencies [2344eb26ed]
- Updated dependencies [a11fcf8b50]
- Updated dependencies [a931594]
- Updated dependencies [e7ce063]
- Updated dependencies [b18fa8f3ed]
- Updated dependencies [7879e8f]
- Updated dependencies [50d4675]
- Updated dependencies [c9e800d39a]
- Updated dependencies [6604f1b]
- Updated dependencies [6aca875]
- Updated dependencies [fda836f]
- Updated dependencies [d6bc321]
- Updated dependencies [3e57f2bd58]
- Updated dependencies [2e6031955e]
- Updated dependencies [c5798d2]
- Updated dependencies [fbf5eed5aa]
- Updated dependencies [a2509bfbdb]
- Updated dependencies [a7c6883]
- Updated dependencies [425e57092d]
- Updated dependencies [e4357f1856]
- Updated dependencies [7b7d12c]
- Updated dependencies [4369648ae2]
- Updated dependencies [92f0eade39]
- Updated dependencies [92c0994468]
- Updated dependencies [2cc2eb3]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [60d5378632]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [9144c21]
- Updated dependencies [b710adb843]
- Updated dependencies [18aaf42249]
- Updated dependencies [34702d5]
- Updated dependencies [fcace5b5b9]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/runtime@2.0.0-beta.4
  - @modern-js/utils@2.0.0-beta.4

## 2.0.0-beta.3

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 6604f1b: feat: support router basename
  feat: router 插件支持设置 basename
- 21d2ddb: feat: support async export provider for module federation
  支持模块联邦场景异步导出 provider
- cce8ece: fix: handle some `TODO` & `FIXME`, change some tests
  fix: 处理一些 `TODO` 和 `FIXME`, 修改了一些 tests
- 2344eb26ed: fix: loadApp when dom is mount
  修复 dom 未渲染时挂载子应用行为
- Updated dependencies [2344eb26ed]
- Updated dependencies [a11fcf8b50]
- Updated dependencies [e7ce063]
- Updated dependencies [b18fa8f3ed]
- Updated dependencies [c9e800d39a]
- Updated dependencies [6604f1b]
- Updated dependencies [6aca875]
- Updated dependencies [fda836f]
- Updated dependencies [3e57f2bd58]
- Updated dependencies [2e60319]
- Updated dependencies [fbf5eed5aa]
- Updated dependencies [a2509bfbdb]
- Updated dependencies [425e570]
- Updated dependencies [e4357f1]
- Updated dependencies [4369648ae2]
- Updated dependencies [92f0eade39]
- Updated dependencies [92c0994468]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1906]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed5874c6]
- Updated dependencies [60d5378632]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [b710adb]
- Updated dependencies [18aaf42249]
- Updated dependencies [34702d5]
- Updated dependencies [fcace5b5b9]
- Updated dependencies [ea7cf06]
- Updated dependencies [bbe4c4a]
- Updated dependencies [e4558a0]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/runtime@2.0.0-beta.3
  - @modern-js/utils@2.0.0-beta.3

## 2.0.0-beta.2

### Major Changes

- dda38c9c3e: chore: v2

### Patch Changes

- 21d2ddb: feat: support async export provider for module federation
  支持模块联邦场景异步导出 provider
- 2344eb2: fix: loadApp when dom is mount
  修复 dom 未渲染时挂载子应用行为
- Updated dependencies [2344eb2]
- Updated dependencies [a11fcf8]
- Updated dependencies [b18fa8f3ed]
- Updated dependencies [c9e800d39a]
- Updated dependencies [3e57f2b]
- Updated dependencies [fbf5eed]
- Updated dependencies [a2509bfbdb]
- Updated dependencies [e4357f1]
- Updated dependencies [4369648ae2]
- Updated dependencies [92f0ead]
- Updated dependencies [92c0994]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f2e9]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed587]
- Updated dependencies [60d5378632]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9c3e]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [18aaf42]
- Updated dependencies [fcace5b5b9]
- Updated dependencies [abf3421a75]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712da84]
  - @modern-js/runtime@2.0.0-beta.2
  - @modern-js/utils@2.0.0-beta.2

## 2.0.0-beta.1

### Major Changes

- dda38c9: chore: v2

### Patch Changes

- 2344eb2: fix: loadApp when dom is mount
  修复 dom 未渲染时挂载子应用行为
- Updated dependencies [2344eb2]
- Updated dependencies [a11fcf8]
- Updated dependencies [b18fa8f]
- Updated dependencies [c9e800d39a]
- Updated dependencies [3e57f2b]
- Updated dependencies [fbf5eed]
- Updated dependencies [a2509bfbdb]
- Updated dependencies [4369648ae2]
- Updated dependencies [92f0ead]
- Updated dependencies [92c0994]
- Updated dependencies [edd1cfb1af]
- Updated dependencies [cc971eabfc]
- Updated dependencies [5b9049f]
- Updated dependencies [6bda14ed71]
- Updated dependencies [92004d1]
- Updated dependencies [b8bbe036c7]
- Updated dependencies [40ed587]
- Updated dependencies [60d5378632]
- Updated dependencies [d5a31df781]
- Updated dependencies [dda38c9]
- Updated dependencies [8b8e1bb571]
- Updated dependencies [3bbea92b2a]
- Updated dependencies [18aaf42]
- Updated dependencies [fcace5b5b9]
- Updated dependencies [abf3421]
- Updated dependencies [543be9558e]
- Updated dependencies [14b712d]
  - @modern-js/runtime@2.0.0-beta.1
  - @modern-js/utils@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- dda38c9: chore: v2

### Patch Changes

- Updated dependencies [b18fa8f]
- Updated dependencies [c9e800d39]
- Updated dependencies [a2509bf]
- Updated dependencies [4369648ae]
- Updated dependencies [edd1cfb1a]
- Updated dependencies [cc971eabf]
- Updated dependencies [5b9049f]
- Updated dependencies [6bda14ed7]
- Updated dependencies [b8bbe036c]
- Updated dependencies [60d5378]
- Updated dependencies [d5a31df78]
- Updated dependencies [dda38c9]
- Updated dependencies [8b8e1bb57]
- Updated dependencies [3bbea92b2]
- Updated dependencies [fcace5b5b]
- Updated dependencies [abf3421]
- Updated dependencies [543be95]
- Updated dependencies [14b712d]
  - @modern-js/runtime@2.0.0-beta.0
  - @modern-js/utils@2.0.0-beta.0

## 1.21.2

### Patch Changes

- 92501d9: fix(garfish): fix reRender issue when use apps and Garfish.run with activeWhen parameter
  修复在同时调用 apps 和 Garfish.run 方法并提供 activeWhen 参数时重复渲染的问题
  - @modern-js/runtime@1.21.2
  - @modern-js/utils@1.21.2

## 1.21.1

### Patch Changes

- 2baa20b: fix: remove useless mount check ref
  移除过时的确认挂载的 ref
  - @modern-js/runtime@1.21.1
  - @modern-js/utils@1.21.1

## 1.21.0

### Patch Changes

- Updated dependencies [f51c59a]
- Updated dependencies [4c1f3a4]
- Updated dependencies [4c1f3a4]
- Updated dependencies [c40fc4b]
  - @modern-js/runtime@1.21.0
  - @modern-js/utils@1.21.0

## 1.20.1

### Patch Changes

- 3369240: fix(Garfish): invoke setOptions to pass configuration to Garfish instance
  修复 config 无法传递给 Garfish 实例问题
- Updated dependencies [49515c5]
  - @modern-js/utils@1.20.1
  - @modern-js/runtime@1.20.1

## 1.20.0

### Patch Changes

- Updated dependencies [d5d570b]
- Updated dependencies [b57d5ff]
- Updated dependencies [4ddc185]
- Updated dependencies [715df7a]
- Updated dependencies [df8ee7e]
- Updated dependencies [8c05089]
  - @modern-js/utils@1.20.0
  - @modern-js/runtime@1.20.0

## 1.19.0

### Patch Changes

- f3bdbde: fix: register microApps before loadApp
  修复：修复手动控制子应用加载情况下未注册子应用问题
  - @modern-js/runtime@1.19.0
  - @modern-js/utils@1.19.0

## 1.18.1

### Patch Changes

- 6839e46: fix: fix MApp can not pass props to microapp and fix closure causes loadable invalid
  fix: 修复 MApp 无法传递 props 问题，修复 loadable setstate 闭包问题导致 state 更新异常
- Updated dependencies [9fcfbd4]
- Updated dependencies [6c2c745]
  - @modern-js/utils@1.18.1
  - @modern-js/runtime@1.18.1

## 1.18.0

### Patch Changes

- Updated dependencies [8280920]
- Updated dependencies [5227370]
- Updated dependencies [7928bae]
  - @modern-js/utils@1.18.0
  - @modern-js/runtime@1.18.0

## 1.17.0

### Patch Changes

- c3d4a6a: feat: support react 18 ssr
  feat: 支持 React 18 下使用 SSR
- Updated dependencies [1b9176f]
- Updated dependencies [77d3a38]
- Updated dependencies [151329d]
- Updated dependencies [5af9472]
- Updated dependencies [6b6a534]
- Updated dependencies [77d3a38]
- Updated dependencies [6b43a2b]
- Updated dependencies [492437f]
- Updated dependencies [c3d4a6a]
- Updated dependencies [a7be124]
- Updated dependencies [31547b4]
  - @modern-js/utils@1.17.0
  - @modern-js/runtime@1.17.0

## 1.16.1

### Patch Changes

- fix: replaceAll not work in node14

## 1.16.0

### Minor Changes

- 1100dd58c: chore: support react 18

  chore: 支持 React 18

### Patch Changes

- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [a480d6ad0]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
  - @modern-js/utils@1.16.0
  - @modern-js/runtime@1.16.0

## 1.15.0

### Patch Changes

- Updated dependencies [8658a78]
- Updated dependencies [335c97c]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [37cd159]
- Updated dependencies [a04a11b]
  - @modern-js/utils@1.15.0
  - @modern-js/runtime@1.15.0

## 1.8.1

### Patch Changes

- fix: `@modern-js/plugin-garfish` support `pluginName` params

  fix: `@modern-js/plugin-garfish` 支持 `pluginName` 参数

## 1.8.0

### Minor Changes

- 59c941a: chore(runtime): merge `@modern-js/runtime-core` to `@modern-js/runtime`

  chore(runtime): 合并 `@modern-js/runtime-core` 到 `@modern-js/runtime`

### Patch Changes

- e686059: chore: adjust `@modern-js/plugin-garfish` runtime export path

  chore: 调整 `@modern-js/plugin-garfish` runtime 导出路径

- 246ac0d: feat: support runtime masterApp type

  feat: 支持在 `modern.config.ts` 中提示 `runtime.masterApp` 类型

- Updated dependencies [79e83ef]
- Updated dependencies [e0cd14a]
- Updated dependencies [287ac8b]
- Updated dependencies [22f4dca]
- Updated dependencies [59c941a]
- Updated dependencies [7b9067f]
  - @modern-js/utils@1.9.0
  - @modern-js/runtime@1.5.0

## 1.7.0

### Minor Changes

- 4fc801f: chore(runtime): merge `@modern-js/plugin-router` to `@modern-js/runtime`

  chore(runtime): 合并 `@modern-js/plugin-router` 到 `@modern-js/runtime`

### Patch Changes

- Updated dependencies [1421965]
- Updated dependencies [4fc801f]
- Updated dependencies [b8ea9cd]
- Updated dependencies [4fc801f]
- Updated dependencies [4fc801f]
- Updated dependencies [4fc801f]
- Updated dependencies [4fc801f]
- Updated dependencies [16eaebd]
- Updated dependencies [8f046e8]
- Updated dependencies [c8614b8]
  - @modern-js/runtime@1.4.0
  - @modern-js/utils@1.8.0

## 1.6.2

### Patch Changes

- 7b9e302: fix: incorrect @babel/runtime version
- Updated dependencies [dc37349]
- Updated dependencies [a90bc96]
  - @modern-js/plugin-router@1.2.16
  - @modern-js/utils@1.7.9

## 1.6.0

### Minor Changes

- 43bf23361: fix: 修复 bootstrap 函数第二个参数不支持传入 dom 节点
  feat: '@modern-js/plugin-garfish' 支持 '@modern-js/runtime/garfish' scope 导出 garfish plugin 内置函数

### Patch Changes

- 209d0a927: release: hot fix garfish error
- 996b91d9d: fix: optimize garfish plugin render function
- 43bf23361: fix(garfish-plugin): app static properties missing
- Updated dependencies [9377d2d9d]
- Updated dependencies [8c9ad1749]
  - @modern-js/utils@1.7.7
  - @modern-js/plugin-router@1.2.15

## 1.5.2

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
- df0694aba: fix(garfish-plugin): app static properties missing
- Updated dependencies [a1198d509]
  - @modern-js/plugin-router@1.2.15

## 1.5.1

### Patch Changes

- 6451a098: fix: cyclic dependencies of @modern-js/core and @moden-js/webpack
- 45d5643a: feat(webpack): support modify html-webpack-plugin
- Updated dependencies [be7262e2]
- Updated dependencies [6451a098]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/runtime-core@1.4.7
  - @modern-js/utils@1.7.6
  - @modern-js/plugin-router@1.2.14

## 1.5.0

### Minor Changes

- f66fa0e98: feat: support tools.webpackChain config

### Patch Changes

- 1dfe08fcd: feat(webpack): add CHAIN_ID constants for webpack chain
- Updated dependencies [33de0f7ec]
  - @modern-js/utils@1.7.5
  - @modern-js/plugin-router@1.2.14

## 1.4.13

### Patch Changes

- a37960018: fix: default config \_SERVER_DATA to insulationVariable and set disableCssExtract to be true
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
  - @modern-js/utils@1.7.4
  - @modern-js/plugin-router@1.2.14

## 1.4.11

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [97086dde8]
- Updated dependencies [97086dde8]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/plugin-router@1.2.14
  - @modern-js/runtime-core@1.4.6
  - @modern-js/utils@1.7.3

## 1.4.10

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
- Updated dependencies [0f86e133b]
  - @modern-js/runtime-core@1.4.5
  - @modern-js/utils@1.7.2
  - @modern-js/plugin-router@1.2.13

## 1.4.9

### Patch Changes

- 5e15976e: fix(garfish-plugin): garfish unregister undefined and export garfish instance
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- Updated dependencies [2d155c4c]
- Updated dependencies [123e432d]
- Updated dependencies [e5a9b26d]
- Updated dependencies [0b26b93b]
- Updated dependencies [123e432d]
- Updated dependencies [f9f66ef9]
- Updated dependencies [592edabc]
- Updated dependencies [895fa0ff]
- Updated dependencies [3578913e]
- Updated dependencies [1c3beab3]
  - @modern-js/utils@1.6.0
  - @modern-js/plugin-router@1.2.11
  - @modern-js/runtime-core@1.4.3

## 1.4.8

### Patch Changes

- 36e702f8: fix(plugin-garfish): fix useModules component props type and cors config
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- e4cec1ce: types: fix config hook type
- d558d4b5: fix: should not import from @modern-js/utils
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/plugin-router@1.2.10
  - @modern-js/runtime-core@1.4.2

## 1.4.6

### Patch Changes

- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [485375ae]
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/plugin-router@1.2.9
  - @modern-js/runtime-core@1.4.1
  - @modern-js/utils@1.4.0

## 1.4.5

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- 8491b6dd: fix: optimise "types" exports from plugin
- Updated dependencies [bebb39b6]
- Updated dependencies [132f7b53]
- Updated dependencies [c4a7e4a3]
  - @modern-js/plugin-router@1.2.8
  - @modern-js/utils@1.3.7

## 1.4.4

### Patch Changes

- 77116fc6: refactor(plugin-garfish): refactor garfish runtime plugin to new plugin mechanise
  fix(plugin-garfish): fix plugin-garfish runtime config
- Updated dependencies [05ce88a0]
- Updated dependencies [a8df060e]
- Updated dependencies [c2046f37]
- Updated dependencies [a2261fed]
- Updated dependencies [cee0efcc]
- Updated dependencies [e31ce644]
- Updated dependencies [6a7acb81]
- Updated dependencies [681a1ff9]
- Updated dependencies [4e2026e4]
  - @modern-js/core@1.6.0
  - @modern-js/utils@1.3.6
  - @modern-js/runtime-core@1.4.0
  - @modern-js/plugin-router@1.2.6

## 1.4.3

### Patch Changes

- e27cefee: feat(plugin-garfish): compatible garfish hooks
- a4dd12c9: feat(plugin-garfish): support automatic parameter transfer
- Updated dependencies [5bf5868d]
  - @modern-js/utils@1.3.5

## 1.4.2

### Patch Changes

- 2520ea86: fix: garfish schema
- Updated dependencies [cc5e8001]
- Updated dependencies [2520ea86]
- Updated dependencies [6a2fd32e]
- Updated dependencies [db43dce6]
- Updated dependencies [e81fd9b7]
- Updated dependencies [1c411e71]
  - @modern-js/core@1.4.6
  - @modern-js/plugin-router@1.2.5
  - @modern-js/utils@1.3.4

## 1.4.0

### Minor Changes

- 4c792f68: feat(plugin-garfish): Sub-applications automatically increment basename
  feat(plugin-garfish): export common generate code function
  fix(plugin-garfish): modify plugin-garfish schema config

### Patch Changes

- 55e18278: chore: remove unused dependencies and devDependencies
- Updated dependencies [969f172f]
- Updated dependencies [4c792f68]
- Updated dependencies [4b5d4bf4]
- Updated dependencies [62f5b8c8]
- Updated dependencies [55e18278]
- Updated dependencies [4499a674]
- Updated dependencies [403f5169]
- Updated dependencies [a7f42f48]
  - @modern-js/core@1.4.4
  - @modern-js/utils@1.3.3
  - @modern-js/runtime-core@1.2.4

## 1.3.1

### Patch Changes

- 53aca274: modify garfish-plugin config type
- Updated dependencies [53aca274]
- Updated dependencies [78279953]
- Updated dependencies [e116ace5]
- Updated dependencies [4d72edea]
  - @modern-js/core@1.4.1
  - @modern-js/utils@1.3.1

## 1.3.0

### Minor Changes

- bada2879: refactor plugin-garfish:
  - change @modern-js/plugin-micro-frontend => @modern-js/plugin-garfish
  - remove disableCustomerRouter logic
  - adding unit test
  - fix plugin-garfish type error

### Patch Changes

- Updated dependencies [d9cc5ea9]
- Updated dependencies [bfbea9a7]
- Updated dependencies [bd819a8d]
- Updated dependencies [ec4dbffb]
- Updated dependencies [d099e5c5]
- Updated dependencies [bada2879]
- Updated dependencies [24f616ca]
- Updated dependencies [bd819a8d]
- Updated dependencies [272cab15]
  - @modern-js/core@1.4.0
  - @modern-js/plugin-router@1.2.2
  - @modern-js/runtime-core@1.2.2
  - @modern-js/utils@1.3.0

## 1.2.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
- Updated dependencies [c3de9882]
- Updated dependencies [33ff48af]
- Updated dependencies [c74597bd]
  - @modern-js/core@1.3.2
  - @modern-js/plugin-router@1.2.1
  - @modern-js/runtime-core@1.2.1
  - @modern-js/utils@1.2.2

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- Updated dependencies [2da09c69]
- Updated dependencies [fc71e36f]
- Updated dependencies [a2cb9abc]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
  - @modern-js/utils@1.2.0
  - @modern-js/core@1.3.0
  - @modern-js/runtime-core@1.2.0
  - @modern-js/plugin-router@1.2.0

## 1.1.3

### Patch Changes

- ad107726: feat: new action support apppend type define
- Updated dependencies [e63591cc]
  - @modern-js/plugin-router@1.1.3
  - @modern-js/runtime-core@1.1.4

## 1.1.2

### Patch Changes

- 4a281912: fix: app init function not work
- Updated dependencies [4a281912]
- Updated dependencies [4a281912]
- Updated dependencies [b7fb82ec]
- Updated dependencies [eb026119]
  - @modern-js/runtime-core@1.1.3
  - @modern-js/plugin-router@1.1.2
  - @modern-js/utils@1.1.6

## 1.1.1

### Patch Changes

- 0fa83663: support more .env files
- f594fbc8: fix apple icon and favicon support
- Updated dependencies [6f7fe574]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/core@1.1.2
  - @modern-js/runtime-core@1.1.1
  - @modern-js/utils@1.1.2
  - @modern-js/plugin-router@1.1.1

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/core@1.1.0
  - @modern-js/plugin-router@1.1.0
  - @modern-js/runtime-core@1.1.0
  - @modern-js/utils@1.1.0

## 1.0.0

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0
  - @modern-js/plugin-router@1.0.0
  - @modern-js/runtime-core@1.0.0
  - @modern-js/utils@1.0.0

## 1.0.0-rc.23

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.23
  - @modern-js/plugin-router@1.0.0-rc.23
  - @modern-js/runtime-core@1.0.0-rc.23
  - @modern-js/utils@1.0.0-rc.23

## 1.0.0-rc.22

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.22
  - @modern-js/plugin-router@1.0.0-rc.22
  - @modern-js/runtime-core@1.0.0-rc.22
  - @modern-js/utils@1.0.0-rc.22

## 1.0.0-rc.21

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [0fd196e]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.21
  - @modern-js/plugin-router@1.0.0-rc.21
  - @modern-js/runtime-core@1.0.0-rc.21
  - @modern-js/utils@1.0.0-rc.21

## 1.0.0-rc.20

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [undefined]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.20
  - @modern-js/plugin-router@1.0.0-rc.20
  - @modern-js/runtime-core@1.0.0-rc.20
  - @modern-js/utils@1.0.0-rc.20

## 1.0.0-rc.19

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.19
  - @modern-js/plugin-router@1.0.0-rc.19
  - @modern-js/runtime-core@1.0.0-rc.19
  - @modern-js/utils@1.0.0-rc.19

## 1.0.0-rc.18

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/core@1.0.0-rc.18
  - @modern-js/plugin-router@1.0.0-rc.18
  - @modern-js/runtime-core@1.0.0-rc.18
  - @modern-js/utils@1.0.0-rc.18

## 1.0.0-rc.17

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [undefined]
  - @modern-js/core@1.0.0-rc.17
  - @modern-js/plugin-router@1.0.0-rc.17
  - @modern-js/runtime-core@1.0.0-rc.17
  - @modern-js/utils@1.0.0-rc.17

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.16
  - @modern-js/plugin-router@1.0.0-rc.16
  - @modern-js/runtime-core@1.0.0-rc.16
  - @modern-js/utils@1.0.0-rc.16

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.15
  - @modern-js/plugin-router@1.0.0-rc.15
  - @modern-js/runtime-core@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.14
  - @modern-js/plugin-router@1.0.0-rc.14
  - @modern-js/runtime-core@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.13
  - @modern-js/plugin-router@1.0.0-rc.13
  - @modern-js/runtime-core@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.12
  - @modern-js/plugin-router@1.0.0-rc.12
  - @modern-js/runtime-core@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.11
  - @modern-js/plugin-router@1.0.0-rc.11
  - @modern-js/runtime-core@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.10
  - @modern-js/plugin-router@1.0.0-rc.10
  - @modern-js/runtime-core@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.9
  - @modern-js/plugin-router@1.0.0-rc.9
  - @modern-js/runtime-core@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.8
  - @modern-js/plugin-router@1.0.0-rc.8
  - @modern-js/runtime-core@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.7
  - @modern-js/plugin-router@1.0.0-rc.7
  - @modern-js/runtime-core@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.6
  - @modern-js/plugin-router@1.0.0-rc.6
  - @modern-js/runtime-core@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.5
  - @modern-js/plugin-router@1.0.0-rc.5
  - @modern-js/runtime-core@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.4
  - @modern-js/runtime-core@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/core@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
  - @modern-js/runtime-core@1.0.0-rc.3
