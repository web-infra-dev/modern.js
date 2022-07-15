# @modern-js/utils

## 1.7.12

### Patch Changes

- dc4676b: chore(webpack): refactor webpack config, split modules

## 1.7.11

### Patch Changes

- nothing happen, only bump

## 1.7.10

### Patch Changes

- b82869d: export ExecaError type

## 1.7.9

### Patch Changes

- a90bc96: perf(babel): skip babel-plugin-import if package not installed

## 1.7.8

### Patch Changes

- 63c354ad5: fix normalizeToPosixPath utils function args would be null
- 073e9ad78: feat(webpack): improve utils of tools.webpack
- f4a7d49e1: fix: applyOptionsChain argument type

## 1.7.7

### Patch Changes

- 9377d2d9d: feat: support addPlugins util in tools.postcss
- 8c9ad1749: feat(babel-preset-base): prebundle babel plugins

## 1.7.6

### Patch Changes

- 6451a098: fix: cyclic dependencies of @modern-js/core and @moden-js/webpack
- d5a2cfd8: fix(utils): isModernjsMonorepo should return false if there is no package.json
- 437367c6: fix(server): hmr not working when using proxy

## 1.7.5

### Patch Changes

- 33de0f7ec: fix type export

## 1.7.4

### Patch Changes

- b8cfc42cd: feat: prebundle tsconfig-paths and nanoid
- 804a5bb8a: fix(utils): isPnpmWorkspaces not work

## 1.7.3

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- 6ae4a34ae: feat: prebundle all postcss plugins
- b80229c79: use json5 instead typescript
- 948cc4436: fix(utils): fix missing browserslist exports

## 1.7.2

### Patch Changes

- cd7346b0d: fix some peer dependencies problem & change shell log
- 69a728375: fix: remove exports.jsnext:source after publish

## 1.7.0

### Minor Changes

- 0ee4bb4e: feat: prebundle webpack loaders and plugins

### Patch Changes

- 6fa74d5f: add internal metrics and logger

## 1.6.0

### Minor Changes

- 0b26b93b: feat: prebundle all dependencies of @modern-js/core

### Patch Changes

- 2d155c4c: feat(utils): prebundle minimist
- 123e432d: use treeshaking product for ssr bundle
- e5a9b26d: fix: prebundled globbdy type
- 123e432d: uglify ssr bundle for treeshaking
- f9f66ef9: add 'slash' module
- 592edabc: feat: prebundle url-join,mime-types,json5,fast-glob,globby,ora,inquirer
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- 3578913e: fix: export ssrHelpers from subpath
- 1c3beab3: fix: skip prebundle caniuse-lite

## 1.5.0

### Minor Changes

- 3bf4f8b0: feat: support start api server only

### Patch Changes

- b8599d09: fix: failed to generate webpack cache
- 60f7d8bf: feat: add tests dir to npmignore

## 1.4.1

### Patch Changes

- 6800be3b: feat: move storage from plugin-ssr to utils

## 1.4.0

### Minor Changes

- 77ff9754: feat: prebundle some deps (chalk, filesize, import-lazy, strip-ansi)
- d2d1d6b2: feat: support server config

### Patch Changes

- 07a4887e: feat: prebundle commander and signale to @modern-js/utils
- ea2ae711: feat: prebundle dependencies, reduce install size
- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- d2d1d6b2: feat: add prepare hook

## 1.3.7

### Patch Changes

- 132f7b53: feat: move config declarations to @modern-js/core

## 1.3.6

### Patch Changes

- c2046f37: fix: plugin unbundle schema define

## 1.3.5

### Patch Changes

- 5bf5868d: fix: isObject should return false when input is null

## 1.3.4

### Patch Changes

- db43dce6: expose plugin-unbundle configs

## 1.3.3

### Patch Changes

- 4c792f68: feat(plugin-garfish): Sub-applications automatically increment basename
  feat(plugin-garfish): export common generate code function
  fix(plugin-garfish): modify plugin-garfish schema config
- a7f42f48: new user config for plugin-unbundle

## 1.3.2

### Patch Changes

- deeaa602: support svg/proxy/multi-version in unbundled

## 1.3.1

### Patch Changes

- 78279953: compiler entry bug fix and dev build console
- 4d72edea: support dev compiler by entry

## 1.3.0

### Minor Changes

- ec4dbffb: feat: support as a pure api service
- bada2879: refactor plugin-garfish:
  - change @modern-js/plugin-micro-frontend => @modern-js/plugin-garfish
  - remove disableCustomerRouter logic
  - adding unit test
  - fix plugin-garfish type error

### Patch Changes

- d099e5c5: fix error when modify modern.config.js
- 24f616ca: feat: support custom meta info
- bd819a8d: feat: add wait function

## 1.2.2

### Patch Changes

- 83166714: change .npmignore

## 1.2.1

### Patch Changes

- 823809c6: fix: remove plugin-polyfill from app-tools

## 1.2.0

### Minor Changes

- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 2da09c69: Add "typescript" to the dependency list
- c3d46ee4: fix: test config invalid

## 1.1.6

### Patch Changes

- b7fb82ec: fix: get package manager function

## 1.1.5

### Patch Changes

- ca7dcb32: change watch logic

## 1.1.4

### Patch Changes

- d927bc83: update plugins list
- d73ff455: support multi process product
- 9c1ab865: fix: filter invalid ts paths
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product
- d73ff455: support multi process product

## 1.1.3

### Patch Changes

- 085a6a58: refactor server plugin
- 085a6a58: refactor server plugin
- 085a6a58: refactor server conifg
- d280ea33: chore: runtime exports can choose to generate d.ts file
- 085a6a58: support server runtime
- 085a6a58: feat: refactor server plugin

## 1.1.2

### Patch Changes

- 0fa83663: support more .env files
- f594fbc8: fix apple icon and favicon support

## 1.1.1

### Patch Changes

- c0fc0700: feat: support deploy plugin

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

## 1.0.0

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.23

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.22

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.21

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 0fd196e: feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.20

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- feat: fix bugs
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.19

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.18

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- 63be0a5: fix: #118 #104

## 1.0.0-rc.17

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial
- fix: #118 #104

## 1.0.0-rc.16

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial

## 1.0.0-rc.15

### Patch Changes

- 224f7fe: fix server route match
- 30ac27c: feat: add generator package description
- 204c626: feat: initial

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial

## 1.0.0-rc.3

### Patch Changes

- feat: initial
