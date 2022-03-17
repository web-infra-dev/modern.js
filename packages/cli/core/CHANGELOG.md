# @modern-js/core

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
