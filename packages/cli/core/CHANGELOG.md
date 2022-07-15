# @modern-js/core

## 1.13.0

### Minor Changes

- 33cebd2: chore(core): move Hooks types define to `@modern-js/core`

  chore(core): 移动 Hooks 类型定义到 `@modern-js/core` 包

- 33cebd2: chore(plugin-i18n): merge `@modern-js/i18n-cli-language-detector` to `@modern-js/plugin-i18n`

  chore(plugin-i18n): 合并 `@modern-js/i18n-cli-language-detector` 包到 `@modern-js/plugin-i18n` 包作为子路径

- 33cebd2: chore(core): merge `@modern-js/load-config` package to `@modern-js/core` utils

  chore(core): 合并 `@modern-js/load-config` 包到 `@modern-js/core` 包作为 utils 函数

### Patch Changes

- @modern-js/utils@1.7.12

## 1.12.4

### Patch Changes

- nothing happen, only bump
- Updated dependencies
  - @modern-js/utils@1.7.11

## 1.12.3

### Patch Changes

- b82869d: Export types from mergeConfig.ts
- Updated dependencies [b82869d]
  - @modern-js/utils@1.7.10

## 1.12.2

### Patch Changes

- f29e9ba: feat: simplify context usage, no longer depend on containers
- d9564f2: feat: add watchOptions for server watcher
- a90bc96: perf(babel): skip babel-plugin-import if package not installed
- Updated dependencies [3050acc]
- Updated dependencies [f29e9ba]
- Updated dependencies [a90bc96]
  - @modern-js/load-config@1.3.6
  - @modern-js/plugin@1.4.0
  - @modern-js/utils@1.7.9

## 1.12.1

### Patch Changes

- b255072f2: fix(core): failed to load user plugins in modern.config.js
- 7975bfa68: fix(core): incorrect type of tools.terser
- b7302f781: Export some required types
- Updated dependencies [63c354ad5]
- Updated dependencies [073e9ad78]
- Updated dependencies [b7302f781]
- Updated dependencies [f4a7d49e1]
- Updated dependencies [e0e708f83]
  - @modern-js/utils@1.7.8
  - @modern-js/plugin@1.3.8

## 1.12.0

### Minor Changes

- 8e1cedd8a: feat(webpack): support addIncludes and addExcludes in tools.tsLoader

### Patch Changes

- 9377d2d9d: feat: support addPlugins util in tools.postcss
- b7a1cea52: feat: support utils in tools.babel
- 3dfee700c: feat: support addExcludes in tools.less and tools.sass
- Updated dependencies [9377d2d9d]
- Updated dependencies [8c9ad1749]
- Updated dependencies [1ac68424f]
  - @modern-js/utils@1.7.7
  - @modern-js/plugin@1.3.7

## 1.11.2

### Patch Changes

- 8d508c6ed: feat(devServer): support disable hmr or live reload
- 0eff2473c: ignore devServer config fn merge
- f25d6a62e: fix: change bffConfig type define to interface
- a18926bbd: fix(app-tools): dev --config not working
- 8f7c0f898: feat(app-tools): support specify config file in build and deploy command
- Updated dependencies [a1198d509]
- Updated dependencies [a18926bbd]
  - @modern-js/load-config@1.3.4
  - @modern-js/plugin@1.3.6

## 1.11.1

### Patch Changes

- f730081c: feat: modify `RuntimeConfig` type to make it extensible
- d1ab1f05: fix(core): should not register the `core` command
- 2ec8181a: fix(core): modern --version get incorrect value
- 6451a098: fix: cyclic dependencies of @modern-js/core and @moden-js/webpack
- 7fcfd6cc: fix(core): fix tools.postcss typing
- Updated dependencies [6451a098]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/utils@1.7.6

## 1.11.0

### Minor Changes

- f66fa0e98: feat: support tools.webpackChain config

### Patch Changes

- 1dfe08fcd: feat(webpack): add CHAIN_ID constants for webpack chain
- Updated dependencies [54fa1dbd6]
- Updated dependencies [33de0f7ec]
  - @modern-js/plugin@1.3.5
  - @modern-js/utils@1.7.5

## 1.10.3

### Patch Changes

- a37960018: refactor: modify deploy microFrontend type
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
  - @modern-js/utils@1.7.4

## 1.10.2

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- d9d398e16: add filter logic for merge config
- Updated dependencies [d5913bd96]
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/plugin@1.3.4
  - @modern-js/load-config@1.3.3
  - @modern-js/utils@1.7.3

## 1.10.1

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/load-config@1.3.2

## 1.10.0

### Minor Changes

- 0ee4bb4e: feat: prebundle webpack loaders and plugins

### Patch Changes

- a22d3ea8: fix: package manager name in logs and comments
- 5c00db22: fix: ignore existed schema properties
- 92f4909e: fix: cli.init should return correct appContext
- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/utils@1.7.0

## 1.9.0

### Minor Changes

- 0b26b93b: feat: prebundle all dependencies of @modern-js/core

### Patch Changes

- 592edabc: feat: prebundle url-join,mime-types,json5,fast-glob,globby,ora,inquirer
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

## 1.8.0

### Minor Changes

- a4330c73: fix: electron config type && electron generator template
- 3bf4f8b0: feat: support start api server only

### Patch Changes

- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- e4cec1ce: types: fix config hook type
- 3b7aa8bb: feat: add transformPlugin option for legacy plugins
- 5dbbeb57: fix: export extended Command type
- ebfcbb35: chore: bump better-ajv-errors 1.2.0
- 305e0bb4: fix: commander.commandsMap typing not work
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/load-config@1.3.1
  - @modern-js/plugin@1.3.3

## 1.7.0

### Minor Changes

- d2d1d6b2: feat: support server config

### Patch Changes

- 60855eb2: fix: ignore initial watching add event
- ec1b7367: fix: tools config types
- 07a4887e: feat: prebundle commander and signale to @modern-js/utils
- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/utils@1.4.0
  - @modern-js/load-config@1.3.0

## 1.6.1

### Patch Changes

- ef28a4e6: fix: module-tools build error
- 132f7b53: feat: move config declarations to @modern-js/core
- 9d4a005b: fix: config babel via tools.babel
- Updated dependencies [132f7b53]
  - @modern-js/utils@1.3.7

## 1.6.0

### Minor Changes

- 4e2026e4: feat: support new plugin config

### Patch Changes

- 05ce88a0: fix: set default value for type NormalizedConfig to ensure all config keys are required
- a8df060e: support setup dev middleware first step
- 6a7acb81: modify devServer type and name
- Updated dependencies [c2046f37]
- Updated dependencies [dc88abf9]
- Updated dependencies [0462ff77]
  - @modern-js/utils@1.3.6
  - @modern-js/plugin@1.3.2

## 1.5.0

### Minor Changes

- 80d8ddfe: feat: add `CliPlugin` type to define new plugin

### Patch Changes

- 80d3cfb7: fix: server.metrics type
- 42c6b136: feat: support api.setAppContext
- 4e7dcbd5: fix: server.logger type
- 9e8bc4ab: fix: server.routes type
- 0c556e59: fix: tools.less type
- 2008fdbd: convert two packages server part, support server load plugin itself
- Updated dependencies [5bf5868d]
- Updated dependencies [80d8ddfe]
- Updated dependencies [491145e3]
  - @modern-js/utils@1.3.5
  - @modern-js/plugin@1.3.0

## 1.4.6

### Patch Changes

- cc5e8001: fix: load plugins
- 2520ea86: fix: garfish schema
- e81fd9b7: fix: update "server.metrics" type
- 1c411e71: fix: mergeConfig util function
- Updated dependencies [db43dce6]
  - @modern-js/utils@1.3.4

## 1.4.4

### Patch Changes

- 969f172f: support tools.styledComponents for module-tools,support close tsc process with disbaleTsChecker
- 4b5d4bf4: fix: output.copy type
- 62f5b8c8: fix: types
- 55e18278: chore: remove unused dependencies and devDependencies
- 4499a674: feat: support to pass options to plugins
- 403f5169: fix source.moduleScopes type
- Updated dependencies [4c792f68]
- Updated dependencies [55e18278]
- Updated dependencies [a7f42f48]
  - @modern-js/utils@1.3.3
  - @modern-js/load-config@1.2.2

## 1.4.3

### Patch Changes

- 54786e58: add ts check
- Updated dependencies [deeaa602]
  - @modern-js/utils@1.3.2

## 1.4.2

### Patch Changes

- b376c8d6: feat: enhance custom env
- e62c4efd: fix error typo for 'styledComponents'
- e2a8233f: support add schem error hook to core.init

## 1.4.1

### Patch Changes

- 53aca274: modify garfish-plugin config type
- 78279953: compiler entry bug fix and dev build console
- e116ace5: fix: coreOptions types
- 4d72edea: support dev compiler by entry
- Updated dependencies [78279953]
- Updated dependencies [4d72edea]
  - @modern-js/utils@1.3.1

## 1.4.0

### Minor Changes

- bada2879: refactor plugin-garfish:
  - change @modern-js/plugin-micro-frontend => @modern-js/plugin-garfish
  - remove disableCustomerRouter logic
  - adding unit test
  - fix plugin-garfish type error

### Patch Changes

- d9cc5ea9: support resatrt options transfer
- bd819a8d: fix: file route changed not trigger hot reload
- d099e5c5: fix error when modify modern.config.js
- 24f616ca: feat: support custom meta info
- Updated dependencies [ec4dbffb]
- Updated dependencies [d099e5c5]
- Updated dependencies [bada2879]
- Updated dependencies [24f616ca]
- Updated dependencies [bd819a8d]
  - @modern-js/utils@1.3.0

## 1.3.2

### Patch Changes

- 83166714: change .npmignore
- c3de9882: fix: internalDirectory path
- 33ff48af: feat: extend CoreOptions
- Updated dependencies [83166714]
  - @modern-js/load-config@1.2.1
  - @modern-js/plugin@1.2.1
  - @modern-js/utils@1.2.2

## 1.3.1

### Patch Changes

- 4584cc04: export DeployConfig interface
- 7c19fd94: use existing port number for AppContext when dev server is restarted
- Updated dependencies [823809c6]
  - @modern-js/utils@1.2.1

## 1.3.0

### Minor Changes

- fc71e36f: support custom property name for the config in package.json
- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- Updated dependencies [2da09c69]
- Updated dependencies [fc71e36f]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
  - @modern-js/utils@1.2.0
  - @modern-js/load-config@1.2.0
  - @modern-js/plugin@1.2.0

## 1.2.0

### Minor Changes

- 90eeb72c: add modern config schema and types of testing, tools.jest.
  add typesVersions for re-exporting types of @modern-js/plugin-testing.
  fix type lost when redeclareing modules.
- 5a4c557e: feat: support bff test

### Patch Changes

- e04914ce: add route types, fix metrics types
- e04914ce: add route types, fix metrics types
- ecb344dc: fix micro-frontend type error
- Updated dependencies [ca7dcb32]
  - @modern-js/utils@1.1.5

## 1.1.4

### Patch Changes

- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- Updated dependencies [d927bc83]
- Updated dependencies [d73ff455]
- Updated dependencies [9c1ab865]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
- Updated dependencies [d73ff455]
  - @modern-js/utils@1.1.4

## 1.1.3

### Patch Changes

- 085a6a58: refactor server plugin
- 085a6a58: refactor server plugin
- 085a6a58: refactor server conifg
- d4fcc73a: add options.plugins:
- 085a6a58: support server runtime
- ed1f6b12: feat: support build --analyze
- a5ebbb00: fix: remove enableUsageBuiltIns config
- 085a6a58: feat: refactor server plugin
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
- Updated dependencies [d280ea33]
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
  - @modern-js/utils@1.1.3

## 1.1.2

### Patch Changes

- 6f7fe574: modern-js/core support extra options
- 0fa83663: support more .env files
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/load-config@1.1.1
  - @modern-js/plugin@1.1.2
  - @modern-js/utils@1.1.2

## 1.1.1

### Patch Changes

- 687c92c7: refactor: generator input questions
  feat: add eslint generator
- Updated dependencies [c0fc0700]
- Updated dependencies [6ffd1a50]
  - @modern-js/utils@1.1.1
  - @modern-js/plugin@1.1.1

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/load-config@1.1.0
  - @modern-js/plugin@1.1.0
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
  - @modern-js/load-config@1.0.0
  - @modern-js/plugin@1.0.0
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
  - @modern-js/load-config@1.0.0-rc.28
  - @modern-js/plugin@1.0.0-rc.23
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
  - @modern-js/load-config@1.0.0-rc.27
  - @modern-js/plugin@1.0.0-rc.22
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
  - @modern-js/load-config@1.0.0-rc.26
  - @modern-js/plugin@1.0.0-rc.21
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
  - @modern-js/load-config@1.0.0-rc.24
  - @modern-js/plugin@1.0.0-rc.20
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
  - @modern-js/load-config@1.0.0-rc.23
  - @modern-js/plugin@1.0.0-rc.19
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
  - @modern-js/load-config@1.0.0-rc.22
  - @modern-js/plugin@1.0.0-rc.18
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
  - @modern-js/load-config@1.0.0-rc.17
  - @modern-js/plugin@1.0.0-rc.17
  - @modern-js/utils@1.0.0-rc.17

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.16
  - @modern-js/plugin@1.0.0-rc.16
  - @modern-js/utils@1.0.0-rc.16

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [30ac27c]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.15
  - @modern-js/plugin@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.14
  - @modern-js/plugin@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.13
  - @modern-js/plugin@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.12
  - @modern-js/plugin@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.11
  - @modern-js/plugin@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.10
  - @modern-js/plugin@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.9
  - @modern-js/plugin@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.8
  - @modern-js/plugin@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.7
  - @modern-js/plugin@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.6
  - @modern-js/plugin@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.5
  - @modern-js/plugin@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/load-config@1.0.0-rc.4
  - @modern-js/plugin@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/load-config@1.0.0-rc.3
  - @modern-js/plugin@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
