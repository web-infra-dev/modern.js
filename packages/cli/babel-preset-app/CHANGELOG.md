# @modern-js/babel-preset-app

## 1.19.0

### Patch Changes

- @modern-js/babel-preset-base@1.19.0
- @modern-js/utils@1.19.0

## 1.18.1

### Patch Changes

- Updated dependencies [9fcfbd4]
- Updated dependencies [6c2c745]
  - @modern-js/utils@1.18.1
  - @modern-js/babel-preset-base@1.18.1

## 1.18.0

### Patch Changes

- 968be1b: feat: add overrideBrowserslist option

  feat: 新增 overrideBrowserslist 选项

- Updated dependencies [8280920]
- Updated dependencies [5227370]
- Updated dependencies [968be1b]
- Updated dependencies [7928bae]
  - @modern-js/utils@1.18.0
  - @modern-js/babel-preset-base@1.18.0

## 1.17.0

### Patch Changes

- f1a09c5: feat(babel-preset-app): bump core-js version to support more polyfills

  feat(babel-preset-app): 升级默认的 core-js 版本，支持更多 polyfill

- 7b8ecf5: fix: `useLoader` auto-generated id

  fix: 修复 `useLoader` 自动生成的 id

- Updated dependencies [1b9176f]
- Updated dependencies [77d3a38]
- Updated dependencies [151329d]
- Updated dependencies [5af9472]
- Updated dependencies [6b6a534]
- Updated dependencies [6b43a2b]
- Updated dependencies [a7be124]
- Updated dependencies [31547b4]
  - @modern-js/utils@1.17.0
  - @modern-js/babel-preset-base@1.17.0

## 1.16.0

### Patch Changes

- Updated dependencies [641592f52]
- Updated dependencies [3904b30a5]
- Updated dependencies [1100dd58c]
- Updated dependencies [e04e6e76a]
- Updated dependencies [81c66e4a4]
- Updated dependencies [2c305b6f5]
  - @modern-js/utils@1.16.0
  - @modern-js/babel-preset-base@1.16.0

## 1.15.0

### Patch Changes

- e8a1e8e: fix(babel-preset-app): incorrect babel plugin path

  fix(babel-preset-app): 修复 babel 插件路径错误的问题

- Updated dependencies [8658a78]
- Updated dependencies [05d4a4f]
- Updated dependencies [ad05af9]
- Updated dependencies [5d53d1c]
- Updated dependencies [37cd159]
  - @modern-js/utils@1.15.0
  - @modern-js/babel-preset-base@1.15.0

## 1.6.0

### Minor Changes

- 7b9067f: add babel plugin for webpack-builder

### Patch Changes

- 22f4dca: chore: move pre-bundled ajv to @modern-js/utils

  chore: 预打包的 ajv 产物移动至 @modern-js/utils 内

- Updated dependencies [79e83ef]
- Updated dependencies [22f4dca]
- Updated dependencies [7b9067f]
  - @modern-js/utils@1.9.0
  - @modern-js/babel-preset-base@1.6.0

## 1.5.0

### Minor Changes

- 33cebd2: chore(babel-chain): merge `@modern-js/babel-chain` to `@modern-js/babel-preset-base`

  chore(babel-chain): 合并 `@modern-js/babel-chain` 到 `@modern-js/babel-preset-base`

### Patch Changes

- Updated dependencies [33cebd2]
  - @modern-js/babel-preset-base@1.5.0
  - @modern-js/utils@1.7.12

## 1.4.2

### Patch Changes

- 63c354ad5: fix normalizeToPosixPath utils function args would be null
- 12fc5ac88: feat: improve babel-plugin-lock-corejs-version performance
- 97bb6adb9: fix: utils.addIncludes is not a function
- Updated dependencies [63c354ad5]
- Updated dependencies [073e9ad78]
- Updated dependencies [f4a7d49e1]
  - @modern-js/utils@1.7.8
  - @modern-js/babel-preset-base@1.4.2

## 1.4.1

### Patch Changes

- b7a1cea52: feat: support utils in tools.babel
- Updated dependencies [9377d2d9d]
- Updated dependencies [8c9ad1749]
- Updated dependencies [b7a1cea52]
- Updated dependencies [fde14696e]
  - @modern-js/utils@1.7.7
  - @modern-js/babel-preset-base@1.4.1

## 1.4.0

### Minor Changes

- a1198d509: fix: regenerator-runtime is bundled twice

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
- Updated dependencies [a1198d509]
- Updated dependencies [a1198d509]
  - @modern-js/babel-preset-base@1.4.0
  - @modern-js/babel-chain@1.2.5

## 1.3.4

### Patch Changes

- 0276ffa2: fix(babel): fix duplicate `useLoader` id by compilation'
- Updated dependencies [6451a098]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/utils@1.7.6

## 1.3.3

### Patch Changes

- 602299a4d: feat(babel-preset-app): enable babel runtime helpers for client bundles
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
  - @modern-js/utils@1.7.4

## 1.3.2

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- 1a30be07b: fix: remove some babel plugins that provided by @babel/preset-env
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [1a30be07b]
- Updated dependencies [948cc4436]
  - @modern-js/babel-preset-base@1.3.2
  - @modern-js/babel-chain@1.2.3
  - @modern-js/utils@1.7.3

## 1.3.1

### Patch Changes

- 0e0537005: fix: unlock @babel/core version
- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [0e0537005]
- Updated dependencies [69a728375]
- Updated dependencies [0f86e133b]
  - @modern-js/babel-preset-base@1.3.1
  - @modern-js/utils@1.7.2

## 1.3.0

### Minor Changes

- 0ee4bb4e: feat: prebundle webpack loaders and plugins

### Patch Changes

- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/babel-preset-base@1.3.0
  - @modern-js/utils@1.7.0

## 1.2.7

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/babel-preset-base@1.2.5
  - @modern-js/babel-chain@1.2.2

## 1.2.6

### Patch Changes

- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/utils@1.4.0
  - @modern-js/babel-preset-base@1.2.4

## 1.2.5

### Patch Changes

- 9d4a005b: fix: config babel via tools.babel
- Updated dependencies [132f7b53]
  - @modern-js/utils@1.3.7

## 1.2.4

### Patch Changes

- 969f172f: support tools.styledComponents for module-tools,support close tsc process with disbaleTsChecker
- Updated dependencies [969f172f]
- Updated dependencies [4c792f68]
- Updated dependencies [a7f42f48]
  - @modern-js/babel-preset-base@1.2.3
  - @modern-js/utils@1.3.3

## 1.2.3

### Patch Changes

- e62c4efd: fix error typo for 'styledComponents'
- Updated dependencies [e62c4efd]
  - @modern-js/babel-preset-base@1.2.2

## 1.2.2

### Patch Changes

- 24f616ca: feat: support custom meta info
- 198fd9c0: fix: babel preset options
- Updated dependencies [ec4dbffb]
- Updated dependencies [d099e5c5]
- Updated dependencies [bada2879]
- Updated dependencies [24f616ca]
- Updated dependencies [bd819a8d]
  - @modern-js/utils@1.3.0

## 1.2.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
  - @modern-js/babel-preset-base@1.2.1
  - @modern-js/babel-chain@1.2.1
  - @modern-js/utils@1.2.2

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 1ebc7ee2: fix: @babel/core version
- Updated dependencies [2da09c69]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
  - @modern-js/utils@1.2.0
  - @modern-js/babel-preset-base@1.2.0
  - @modern-js/babel-chain@1.2.0

## 1.1.1

### Patch Changes

- b011e0c5: fix(babel): declare
- 0fa83663: support more .env files
- Updated dependencies [ba51d68b]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/babel-preset-base@1.1.1
  - @modern-js/babel-chain@1.1.1
  - @modern-js/utils@1.1.2

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0### Patch Changes

- Updated dependencies [96119db2]
- Updated dependencies [c503176f]
  - @modern-js/babel-preset-base@1.1.0
  - @modern-js/babel-chain@1.1.0
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
  - @modern-js/babel-preset-base@1.0.0
  - @modern-js/babel-chain@1.0.0
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
  - @modern-js/babel-preset-base@1.0.0-rc.23
  - @modern-js/babel-chain@1.0.0-rc.23
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
  - @modern-js/babel-preset-base@1.0.0-rc.22
  - @modern-js/babel-chain@1.0.0-rc.22
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
  - @modern-js/babel-preset-base@1.0.0-rc.21
  - @modern-js/babel-chain@1.0.0-rc.21
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
  - @modern-js/babel-preset-base@1.0.0-rc.20
  - @modern-js/babel-chain@1.0.0-rc.20
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
  - @modern-js/babel-preset-base@1.0.0-rc.19
  - @modern-js/babel-chain@1.0.0-rc.19
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
  - @modern-js/babel-preset-base@1.0.0-rc.18
  - @modern-js/babel-chain@1.0.0-rc.18
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
  - @modern-js/babel-preset-base@1.0.0-rc.17
  - @modern-js/babel-chain@1.0.0-rc.17
  - @modern-js/utils@1.0.0-rc.17

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.16
  - @modern-js/babel-chain@1.0.0-rc.16
  - @modern-js/utils@1.0.0-rc.16

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.15
  - @modern-js/babel-chain@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.14
  - @modern-js/babel-chain@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.13
  - @modern-js/babel-chain@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.12
  - @modern-js/babel-chain@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.11
  - @modern-js/babel-chain@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.10
  - @modern-js/babel-chain@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.9
  - @modern-js/babel-chain@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.8
  - @modern-js/babel-chain@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.7
  - @modern-js/babel-chain@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.6
  - @modern-js/babel-chain@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.5
  - @modern-js/babel-chain@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-base@1.0.0-rc.4
  - @modern-js/babel-chain@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/babel-preset-base@1.0.0-rc.3
  - @modern-js/babel-chain@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
