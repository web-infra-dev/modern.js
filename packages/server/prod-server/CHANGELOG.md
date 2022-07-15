# @modern-js/prod-server

## 1.2.0

### Minor Changes

- 3d64b2f: feat: prod-server supports that load server env from .env.\*

  feat: prod-server 支持从 .env.\* 文件加载服务器环境变量

### Patch Changes

- 7b902b3: feat: support ListenOptions for prod-server

  feat: server 支持传入 listernOptions 参数

- Updated dependencies [a27ab8d]
  - @modern-js/server-core@1.4.1
  - @modern-js/utils@1.7.12

## 1.1.9

### Patch Changes

- f29e9ba: feat: simplify context usage, no longer depend on containers
- 2dacc89: support set header & status in render
- Updated dependencies [77a8e9e]
- Updated dependencies [f29e9ba]
- Updated dependencies [a90bc96]
  - @modern-js/server-core@1.4.0
  - @modern-js/utils@1.7.9

## 1.1.8

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
  - @modern-js/server-core@1.3.5

## 1.1.7

### Patch Changes

- d4afeba71: fix: remove cors for prod-server

## 1.1.6

### Patch Changes

- 430d417e: optimize server side hot reload
- Updated dependencies [6451a098]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/utils@1.7.6
  - @modern-js/server-core@1.3.5

## 1.1.5

### Patch Changes

- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- 86fe5a657: support handle server context init error
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/server-core@1.3.5
  - @modern-js/utils@1.7.3

## 1.1.4

### Patch Changes

- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/server-core@1.3.4

## 1.1.3

### Patch Changes

- a4c5fe78: fix test case
- 6fa74d5f: add internal metrics and logger
- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/utils@1.7.0
  - @modern-js/server-core@1.3.3

## 1.1.2

### Patch Changes

- a0499e4f: fix: throw error in server config
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
  - @modern-js/server-core@1.3.2

## 1.1.1

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- Updated dependencies [b8599d09]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/server-core@1.3.1

## 1.1.0

### Minor Changes

- d2d1d6b2: feat: support server config

### Patch Changes

- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/utils@1.4.0
  - @modern-js/server-core@1.3.0

## 1.0.6

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- 132f7b53: feat: move config declarations to @modern-js/core
- Updated dependencies [bebb39b6]
- Updated dependencies [132f7b53]
  - @modern-js/server-core@1.2.5
  - @modern-js/utils@1.3.7

## 1.0.5

### Patch Changes

- d2d0fa11: fix: missing devServer.proxy typing
- Updated dependencies [a8df060e]
- Updated dependencies [c2046f37]
- Updated dependencies [18db013a]
  - @modern-js/server-core@1.2.4
  - @modern-js/utils@1.3.6

## 1.0.4

### Patch Changes

- d95f28c3: should enable babel register before server plugin require
- d95f28c3: remove server hook when api only
- 0923c182: fix static handler when static file not exist
- 2008fdbd: convert two packages server part, support server load plugin itself
- ca0bcf13: publish prod-server local
- Updated dependencies [5bf5868d]
- Updated dependencies [d95f28c3]
- Updated dependencies [2e8dec93]
- Updated dependencies [2008fdbd]
- Updated dependencies [2e8dec93]
  - @modern-js/utils@1.3.5
  - @modern-js/server-core@1.2.3

## 1.0.2

### Patch Changes

- a78e32d8: remove server hook when api only
- e11eaafc: fix runner error in dev
- cbba492b: add serverless pre-render unit-test
- 59010b7a: rewrite server lifecycle, add unit test
- Updated dependencies [cc5e8001]
- Updated dependencies [2520ea86]
- Updated dependencies [db43dce6]
- Updated dependencies [e81fd9b7]
- Updated dependencies [1c411e71]
  - @modern-js/core@1.4.6
  - @modern-js/utils@1.3.4

## 1.0.1

### Patch Changes

- 02fb4146: support product server
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
