# @modern-js/generator-common

## 2.4.0

### Patch Changes

- cf1edd1: feat: support custom solution list

  feat: 生成器支持自定义工程方案列表

  - @modern-js/plugin-i18n@1.19.0

## 2.3.4

### Patch Changes

- @modern-js/plugin-i18n@1.18.1

## 2.3.3

### Patch Changes

- 4f77eb4: feat: remove generator create project enable less and sass function

  feat: 移除生成器创建项目支持开启 Less 和 Sass 能力

  - @modern-js/plugin-i18n@1.18.0

## 2.3.1

### Patch Changes

- fb30bca: feat: add upgrade tools and command

  feat: 增加升级工具和升级命令

  - @modern-js/plugin-i18n@1.17.0

## 2.3.0

### Patch Changes

- 94222750f: fix: generator schema validate

  fix: 修复生成器问题校验失败

- 2c305b6f5: chore: remove all deploy logic and package
  chore: 删除所有部署相关的逻辑和包
- 9d9bbfd05: feat: update codesmith package

  feat: 升级 codesmith 包版本

  - @modern-js/plugin-i18n@1.16.0

## 2.2.1

### Patch Changes

- 8658a78: chore: remove `@modern-js/plugin-docsite`

  chore: 移除 `@modern-js/plugin-docsite`

- 9e6a0aa: feat: adjust new command dependencies position

  feat: 调整 new 命令添加依赖位置

  - @modern-js/plugin-i18n@1.15.0

## 1.6.1

### Patch Changes

- 803b903: feat: package manager support isSubProject params

  feat: 生成器包管理工具选项支持 isSubProject 参数

- fd2ecb5: feat: solution schema support isSubProject params

  feat: 生成器工程方案选项支持 isSubProject 参数

## 1.6.0

### Minor Changes

- 52374e3: chore(generator): use module-tools bundle function to bundle generator package

  chore(generator): 使用 module-tools 的 bundle 功能实现生成器打包

## 1.5.0

### Minor Changes

- 33cebd2: chore(generator-utils): tidy up `@modern-js/generator-utils` func

  chore(generastor-utils): 整理 `@modern-js/generator-utils` 导出方法

### Patch Changes

- 72907b2: chore(generator): remove unbundle from generator options

  chore(generator): 不再支持通过 new 命令开启 unbundle 功能

- Updated dependencies [33cebd2]
  - @modern-js/plugin-i18n@1.3.0

## 1.4.13

### Patch Changes

- 341bb42: feat: bump codesmith package version
- Updated dependencies [a90bc96]
  - @modern-js/utils@1.7.9

## 1.4.12

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
- c7e38b4e6: feat: upgrade codesmith pkg version
- Updated dependencies [a1198d509]
  - @modern-js/plugin-i18n@1.2.7

## 1.4.11

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/plugin-i18n@1.2.6
  - @modern-js/utils@1.7.3

## 1.4.10

### Patch Changes

- 6b0bb5e3b: feat: bump codesmith version
- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/plugin-i18n@1.2.5

## 1.4.9

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
  - @modern-js/plugin-i18n@1.2.4

## 1.4.8

### Patch Changes

- 132f7b53: feat: move config declarations to @modern-js/core
- 8491b6dd: fix: optimise "types" exports from plugin

## 1.4.7

### Patch Changes

- c2046f37: fix(plugin-unbundle): fix unbundle types

## 1.4.6

### Patch Changes

- 0c556e59: fix: tools.less type
- 9b2640fe: fix: dev.proxy type not work

## 1.4.5

### Patch Changes

- 3eee457b: fix: move some peerDependencies to dependecies
- aed9912e: fix: output.ssg type error

## 1.4.4

### Patch Changes

- c29451a5: fix package manager schema
- 83059b93: fix tailwindcss type reference
- 83059b93: fix module solution tailwindcss version when new tainwindcss function
- 83059b93: fix tailwindcss generator

## 1.4.3

### Patch Changes

- 6668a1bf: feat: upgrade @modern-js/codesmith-api-app version
- 6668a1bf: feat: package manager options support npm

## 1.4.2

### Patch Changes

- 1fad4bb7: feat: support enable proxy in mwa project

## 1.4.1

### Patch Changes

- 9a505589: fix: generator scenes order

## 1.4.0

### Minor Changes

- bada2879: refactor plugin-garfish:
  - change @modern-js/plugin-micro-frontend => @modern-js/plugin-garfish
  - remove disableCustomerRouter logic
  - adding unit test
  - fix plugin-garfish type error

### Patch Changes

- 5a7901d7: fix ssg url

## 1.3.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
  - @modern-js/plugin-i18n@1.2.1

## 1.3.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 2c049918: feat: polyfill function support enable using new command
- Updated dependencies [cfe11628]
  - @modern-js/plugin-i18n@1.2.0

## 1.2.4

### Patch Changes

- ad107726: feat: new action support apppend type define

## 1.2.3

### Patch Changes

- 4819a3c7: feat: update generator version
- Updated dependencies [5e3de7d8]
  - @modern-js/plugin-i18n@1.1.2

## 1.2.2

### Patch Changes

- facd5bf8: fix: create sub-solution error

## 1.2.1

### Patch Changes

- 4a5214db: fix: generator plugin error

## 1.2.0

### Minor Changes

- e12b3d0b: feat: support generator plugin

## 1.1.3

### Patch Changes

- 2c0750e1: fix generator export config

## 1.1.2

### Patch Changes

- 0fa83663: support more .env files
- 429aab90: feat: base generator support input
- Updated dependencies [0fa83663]
  - @modern-js/plugin-i18n@1.1.1

## 1.1.1

### Patch Changes

- 687c92c7: refactor: generator input questions
  feat: add eslint generator
- c0fc0700: feat: support deploy plugin

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/plugin-i18n@1.1.0

## 1.0.1

### Patch Changes

- feat: update generator template

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
  - @modern-js/plugin-i18n@1.0.0

## 1.0.0-rc.24

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
  - @modern-js/plugin-i18n@1.0.0-rc.23

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
  - @modern-js/plugin-i18n@1.0.0-rc.22

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
  - @modern-js/plugin-i18n@1.0.0-rc.21

## 1.0.0-rc.21

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
  - @modern-js/plugin-i18n@1.0.0-rc.20

## 1.0.0-rc.20

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [63be0a5]
  - @modern-js/plugin-i18n@1.0.0-rc.19

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
  - @modern-js/plugin-i18n@1.0.0-rc.18

## 1.0.0-rc.18

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- fix: #118 #104
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
- Updated dependencies [undefined]
  - @modern-js/plugin-i18n@1.0.0-rc.17

## 1.0.0-rc.17

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.16

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.15

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.14

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.13

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.12

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.11

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.10

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.9

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.8

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.7

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.6

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.5

## 1.0.0-rc.5

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/plugin-i18n@1.0.0-rc.4

## 1.0.0-rc.4

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/plugin-i18n@1.0.0-rc.3
