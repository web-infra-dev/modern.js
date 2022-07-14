# @modern-js/plugin-ssr

## 1.5.0

### Minor Changes

- 33cebd2: chore(babel-chain): merge `@modern-js/babel-chain` to `@modern-js/babel-preset-base`

  chore(babel-chain): 合并 `@modern-js/babel-chain` 到 `@modern-js/babel-preset-base`

### Patch Changes

- Updated dependencies [b74b0b6]
- Updated dependencies [8b2aa56]
- Updated dependencies [3e4a34f]
- Updated dependencies [33cebd2]
  - @modern-js/webpack@1.12.0
  - @modern-js/runtime-core@1.5.3
  - @modern-js/utils@1.7.12

## 1.4.6

### Patch Changes

- 43b2224: support init return value inject to SSR DATA
- 2dacc89: support set header & status in render
- Updated dependencies [550e2bd]
- Updated dependencies [87eb9f8]
- Updated dependencies [43b2224]
- Updated dependencies [2b06fe3]
- Updated dependencies [3050acc]
- Updated dependencies [f29e9ba]
- Updated dependencies [2dacc89]
- Updated dependencies [338496c]
- Updated dependencies [a90bc96]
  - @modern-js/webpack@1.11.3
  - @modern-js/runtime-core@1.5.2
  - @modern-js/utils@1.7.9

## 1.4.5

### Patch Changes

- a1198d509: feat: bump babel 7.18.0
- Updated dependencies [8d508c6ed]
- Updated dependencies [a1198d509]
- Updated dependencies [29728812e]
- Updated dependencies [147e090f7]
- Updated dependencies [18892c65c]
- Updated dependencies [a1198d509]
  - @modern-js/webpack@1.10.0
  - @modern-js/runtime-core@1.4.9

## 1.4.4

### Patch Changes

- 6c8ab42dd: optimize whether to do SSR bundle
- fc43fef39: fix ssr types
- Updated dependencies [6c8ab42dd]
- Updated dependencies [808baede3]
- Updated dependencies [ed90859ba]
- Updated dependencies [0ef2431cb]
- Updated dependencies [37250cb8f]
- Updated dependencies [a204922e8]
  - @modern-js/webpack@1.9.1
  - @modern-js/runtime-core@1.4.8

## 1.4.2

### Patch Changes

- 192dbc78: adjust ssr types
- 7394df61: feat: prebundle @loadable/webpack-plugin and fix peer deps warning
- Updated dependencies [5f7fccf0]
- Updated dependencies [02b0a22e]
- Updated dependencies [da65bf12]
- Updated dependencies [be7262e2]
- Updated dependencies [8854c600]
- Updated dependencies [f7cbc771]
- Updated dependencies [6451a098]
- Updated dependencies [f5c48c3f]
- Updated dependencies [658b4dd5]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [45d5643a]
- Updated dependencies [0d161fa8]
- Updated dependencies [437367c6]
- Updated dependencies [280eebf9]
- Updated dependencies [2ba8d62f]
- Updated dependencies [7394df61]
  - @modern-js/webpack@1.9.0
  - @modern-js/runtime-core@1.4.7
  - @modern-js/utils@1.7.6

## 1.4.1

### Patch Changes

- 6f410386f: init hook should return next()

## 1.4.0

### Minor Changes

- f66fa0e98: feat: support tools.webpackChain config

### Patch Changes

- 1dfe08fcd: feat(webpack): add CHAIN_ID constants for webpack chain
- Updated dependencies [33de0f7ec]
  - @modern-js/utils@1.7.5

## 1.3.3

### Patch Changes

- a2f5a1b12: fix loadable & useloader problem
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
  - @modern-js/utils@1.7.4

## 1.3.2

### Patch Changes

- 97086dde8: fix ssr data structure
- 5bfb57321: add ssr count metrics
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [97086dde8]
- Updated dependencies [97086dde8]
- Updated dependencies [b80229c79]
- Updated dependencies [948cc4436]
  - @modern-js/runtime-core@1.4.6
  - @modern-js/utils@1.7.3

## 1.3.1

### Patch Changes

- 0e0537005: fix: unlock @babel/core version
- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [69a728375]
- Updated dependencies [0f86e133b]
  - @modern-js/runtime-core@1.4.5
  - @modern-js/utils@1.7.2

## 1.3.0

### Minor Changes

- 0ee4bb4e: feat: prebundle webpack loaders and plugins

### Patch Changes

- a4c5fe78: fix test case
- 6fa74d5f: add internal metrics and logger
- 33386756: reuse node entry for ssr plugin
- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/utils@1.7.0
  - @modern-js/runtime-core@1.4.4

## 1.2.8

### Patch Changes

- a0475f1a: fix: missing @babel/core peer dependencies
- 123e432d: use treeshaking product for ssr bundle
- 123e432d: uglify ssr bundle for treeshaking
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- 3578913e: fix: export ssrHelpers from subpath
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
  - @modern-js/runtime-core@1.4.3

## 1.2.7

### Patch Changes

- e4cec1ce: types: fix config hook type
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [60f7d8bf]
- Updated dependencies [3bf4f8b0]
  - @modern-js/utils@1.5.0
  - @modern-js/runtime-core@1.4.2

## 1.2.6

### Patch Changes

- 6800be3b: feat: move storage from plugin-ssr to utils
- Updated dependencies [6800be3b]
  - @modern-js/utils@1.4.1

## 1.2.5

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- ff73a5cc: fix style-component bugs
- 9d4a005b: fix: config babel via tools.babel
- Updated dependencies [132f7b53]
  - @modern-js/utils@1.3.7

## 1.2.4

### Patch Changes

- 57e8ce98: feat(plugin-ssr): convert to new plugin
- 681a1ff9: feat: remove unnecessary peerDependencies
- Updated dependencies [c2046f37]
  - @modern-js/utils@1.3.6

## 1.2.3

### Patch Changes

- deeaa602: support svg/proxy/multi-version in unbundled
- Updated dependencies [deeaa602]
- Updated dependencies [54786e58]
  - @modern-js/utils@1.3.2
  - @modern-js/core@1.4.3

## 1.2.2

### Patch Changes

- 735b2a81: prevent ssr compiler to send socket message
- 735b2a81: fix ssg bug when use ssr by entries
- Updated dependencies [b376c8d6]
- Updated dependencies [e62c4efd]
- Updated dependencies [5ed05e65]
- Updated dependencies [e2a8233f]
  - @modern-js/core@1.4.2
  - @modern-js/runtime-core@1.2.3

## 1.2.1

### Patch Changes

- 816fd721: support more server context
- 272cab15: refactor server plugin manager
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
  - @modern-js/runtime-core@1.2.2
  - @modern-js/utils@1.3.0

## 1.2.0

### Minor Changes

- 5597289b: Fix @modern-js/plugin-ssr exported configuration
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

## 1.1.3

### Patch Changes

- e51b1db3: feat: support custom sdk, interceptor, headers for bff request
- 4a281912: app init function support sync function && ssr data add i18n data
- Updated dependencies [4a281912]
- Updated dependencies [4a281912]
- Updated dependencies [b7fb82ec]
- Updated dependencies [eb026119]
  - @modern-js/runtime-core@1.1.3
  - @modern-js/utils@1.1.6

## 1.1.2

### Patch Changes

- e04914ce: add route types, fix metrics types
- 4406c2db: fix: avoid fetching data again when ssr succeeds
- Updated dependencies [90eeb72c]
- Updated dependencies [e04914ce]
- Updated dependencies [4406c2db]
- Updated dependencies [5a4c557e]
- Updated dependencies [e04914ce]
- Updated dependencies [ca7dcb32]
- Updated dependencies [ecb344dc]
  - @modern-js/core@1.2.0
  - @modern-js/runtime-core@1.1.2
  - @modern-js/utils@1.1.5

## 1.1.1

### Patch Changes

- f594fbc8: fix apple icon and favicon support
- Updated dependencies [6f7fe574]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/core@1.1.2
  - @modern-js/runtime-core@1.1.1
  - @modern-js/utils@1.1.2

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/core@1.1.0
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
  - @modern-js/runtime-core@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.14
  - @modern-js/runtime-core@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.13
  - @modern-js/runtime-core@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.12
  - @modern-js/runtime-core@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.11
  - @modern-js/runtime-core@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.10
  - @modern-js/runtime-core@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.9
  - @modern-js/runtime-core@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.8
  - @modern-js/runtime-core@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.7
  - @modern-js/runtime-core@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.6
  - @modern-js/runtime-core@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/core@1.0.0-rc.5
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
