# @modern-js/webpack

## 1.4.1

### Patch Changes

- 0ad75faa: fix: should not enable fork-ts-checker when using ts-loader
- 4b5d4bf4: fix: output.copy type
- 0ad75faa: feat: improve default options of fork-ts-checker
- 0ad75faa: fix: should only enable fork-ts-checker in typescript project
- Updated dependencies [969f172f]
- Updated dependencies [4c792f68]
- Updated dependencies [4b5d4bf4]
- Updated dependencies [62f5b8c8]
- Updated dependencies [55e18278]
- Updated dependencies [4499a674]
- Updated dependencies [403f5169]
- Updated dependencies [a7f42f48]
  - @modern-js/babel-preset-app@1.2.4
  - @modern-js/core@1.4.4
  - @modern-js/utils@1.3.3

## 1.4.0

### Minor Changes

- 54786e58: add ts check

### Patch Changes

- 3da3bf48: perf: remove case-sensetive-webpack-plugin to improve compile performance
- Updated dependencies [deeaa602]
- Updated dependencies [54786e58]
  - @modern-js/utils@1.3.2
  - @modern-js/core@1.4.3

## 1.3.2

### Patch Changes

- 118da5b4: fix: fix tailwindcss sourcemap building error
- b376c8d6: feat: enhance custom env
- e62c4efd: fix error typo for 'styledComponents'
- Updated dependencies [118da5b4]
- Updated dependencies [b376c8d6]
- Updated dependencies [e62c4efd]
- Updated dependencies [e2a8233f]
  - @modern-js/css-config@1.2.2
  - @modern-js/core@1.4.2
  - @modern-js/babel-preset-app@1.2.3

## 1.3.1

### Patch Changes

- 75f4eeb8: fix: output.enableInlineScripts not working
- 78279953: compiler entry bug fix and dev build console
- 4d72edea: support dev compiler by entry
- Updated dependencies [53aca274]
- Updated dependencies [78279953]
- Updated dependencies [e116ace5]
- Updated dependencies [4d72edea]
  - @modern-js/core@1.4.1
  - @modern-js/utils@1.3.1

## 1.3.0

### Minor Changes

- ec4dbffb: feat: support as a pure api service

### Patch Changes

- ddf0c3a6: feat: support bottom template
- 24f616ca: feat: support custom meta info
- Updated dependencies [d9cc5ea9]
- Updated dependencies [bd819a8d]
- Updated dependencies [ec4dbffb]
- Updated dependencies [d099e5c5]
- Updated dependencies [bada2879]
- Updated dependencies [24f616ca]
- Updated dependencies [198fd9c0]
- Updated dependencies [bd819a8d]
  - @modern-js/core@1.4.0
  - @modern-js/utils@1.3.0
  - @modern-js/babel-preset-app@1.2.2

## 1.2.2

### Patch Changes

- 7dc5aa75: fix: source.include supports regexp

## 1.2.1

### Patch Changes

- 83166714: change .npmignore
- Updated dependencies [83166714]
- Updated dependencies [c3de9882]
- Updated dependencies [33ff48af]
  - @modern-js/babel-preset-app@1.2.1
  - @modern-js/core@1.3.2
  - @modern-js/css-config@1.2.1
  - @modern-js/babel-chain@1.2.1
  - @modern-js/utils@1.2.2

## 1.2.0

### Minor Changes

- 5597289b: Fix @modern-js/plugin-ssr exported configuration
- cfe11628: Make Modern.js self bootstraping

### Patch Changes

- 4a85378c: fix: fix @types/mini-css-extract-plugin version
- e453e421: feat: add \*.global.less/sass/scss support when "output.disableCssModuleExtension" is true
- Updated dependencies [2da09c69]
- Updated dependencies [fc71e36f]
- Updated dependencies [c3d46ee4]
- Updated dependencies [cfe11628]
- Updated dependencies [1ebc7ee2]
  - @modern-js/utils@1.2.0
  - @modern-js/core@1.3.0
  - @modern-js/babel-preset-app@1.2.0
  - @modern-js/css-config@1.2.0
  - @modern-js/babel-chain@1.2.0

## 1.1.4

### Patch Changes

- fix: webpack mini-css-extract-plugin version

## 1.1.3

### Patch Changes

- 9a5e6d14: fix: fix dev.assetPrefix port
- a37192b1: feat: support css module declaration
- ed1f6b12: feat: support build --analyze
- b058c6fa: fix config dir copy error
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
- Updated dependencies [085a6a58]
- Updated dependencies [d280ea33]
- Updated dependencies [d4fcc73a]
- Updated dependencies [085a6a58]
- Updated dependencies [ed1f6b12]
- Updated dependencies [a5ebbb00]
- Updated dependencies [085a6a58]
  - @modern-js/core@1.1.3
  - @modern-js/utils@1.1.3

## 1.1.2

### Patch Changes

- 6f7fe574: modern-js/core support extra options
- e4755134: fix js project ssr build error
- 0fa83663: support more .env files
- 19b4f79e: temporary solutions type error
- f594fbc8: fix apple icon and favicon support
- d1fde77a: fix public/ file in windows
- Updated dependencies [6f7fe574]
- Updated dependencies [b011e0c5]
- Updated dependencies [0fa83663]
- Updated dependencies [f594fbc8]
  - @modern-js/core@1.1.2
  - @modern-js/babel-preset-app@1.1.1
  - @modern-js/css-config@1.1.1
  - @modern-js/babel-chain@1.1.1
  - @modern-js/utils@1.1.2

## 1.1.1

### Patch Changes

- c0fc0700: feat: support deploy plugin
- Updated dependencies [687c92c7]
- Updated dependencies [c0fc0700]
  - @modern-js/core@1.1.1
  - @modern-js/utils@1.1.1

## 1.1.0

### Minor Changes

- 96119db2: Relese v1.1.0

### Patch Changes

- Updated dependencies [96119db2]
  - @modern-js/babel-preset-app@1.1.0
  - @modern-js/core@1.1.0
  - @modern-js/css-config@1.1.0
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
  - @modern-js/babel-preset-app@1.0.0
  - @modern-js/core@1.0.0
  - @modern-js/css-config@1.0.0
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
  - @modern-js/babel-preset-app@1.0.0-rc.23
  - @modern-js/core@1.0.0-rc.23
  - @modern-js/css-config@1.0.0-rc.23
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
  - @modern-js/babel-preset-app@1.0.0-rc.22
  - @modern-js/core@1.0.0-rc.22
  - @modern-js/css-config@1.0.0-rc.22
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
  - @modern-js/babel-preset-app@1.0.0-rc.21
  - @modern-js/core@1.0.0-rc.21
  - @modern-js/css-config@1.0.0-rc.21
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
  - @modern-js/babel-preset-app@1.0.0-rc.20
  - @modern-js/core@1.0.0-rc.20
  - @modern-js/css-config@1.0.0-rc.20
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
  - @modern-js/babel-preset-app@1.0.0-rc.19
  - @modern-js/core@1.0.0-rc.19
  - @modern-js/css-config@1.0.0-rc.19
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
  - @modern-js/babel-preset-app@1.0.0-rc.18
  - @modern-js/core@1.0.0-rc.18
  - @modern-js/css-config@1.0.0-rc.18
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
  - @modern-js/babel-preset-app@1.0.0-rc.17
  - @modern-js/core@1.0.0-rc.17
  - @modern-js/css-config@1.0.0-rc.17
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
  - @modern-js/babel-preset-app@1.0.0-rc.16
  - @modern-js/core@1.0.0-rc.16
  - @modern-js/css-config@1.0.0-rc.16
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
  - @modern-js/babel-preset-app@1.0.0-rc.15
  - @modern-js/core@1.0.0-rc.15
  - @modern-js/css-config@1.0.0-rc.15
  - @modern-js/babel-chain@1.0.0-rc.15
  - @modern-js/utils@1.0.0-rc.15

## 1.0.0-rc.14

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.14
  - @modern-js/core@1.0.0-rc.14
  - @modern-js/css-config@1.0.0-rc.14
  - @modern-js/babel-chain@1.0.0-rc.14
  - @modern-js/utils@1.0.0-rc.14

## 1.0.0-rc.13

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.13
  - @modern-js/core@1.0.0-rc.13
  - @modern-js/css-config@1.0.0-rc.13
  - @modern-js/babel-chain@1.0.0-rc.13
  - @modern-js/utils@1.0.0-rc.13

## 1.0.0-rc.12

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.12
  - @modern-js/core@1.0.0-rc.12
  - @modern-js/css-config@1.0.0-rc.12
  - @modern-js/babel-chain@1.0.0-rc.12
  - @modern-js/utils@1.0.0-rc.12

## 1.0.0-rc.11

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.11
  - @modern-js/core@1.0.0-rc.11
  - @modern-js/css-config@1.0.0-rc.11
  - @modern-js/babel-chain@1.0.0-rc.11
  - @modern-js/utils@1.0.0-rc.11

## 1.0.0-rc.10

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.10
  - @modern-js/core@1.0.0-rc.10
  - @modern-js/css-config@1.0.0-rc.10
  - @modern-js/babel-chain@1.0.0-rc.10
  - @modern-js/utils@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.9
  - @modern-js/core@1.0.0-rc.9
  - @modern-js/css-config@1.0.0-rc.9
  - @modern-js/babel-chain@1.0.0-rc.9
  - @modern-js/utils@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.8
  - @modern-js/core@1.0.0-rc.8
  - @modern-js/css-config@1.0.0-rc.8
  - @modern-js/babel-chain@1.0.0-rc.8
  - @modern-js/utils@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.7
  - @modern-js/core@1.0.0-rc.7
  - @modern-js/css-config@1.0.0-rc.7
  - @modern-js/babel-chain@1.0.0-rc.7
  - @modern-js/utils@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.6
  - @modern-js/core@1.0.0-rc.6
  - @modern-js/css-config@1.0.0-rc.6
  - @modern-js/babel-chain@1.0.0-rc.6
  - @modern-js/utils@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- 224f7fe: fix server route match
- 204c626: feat: initial
- Updated dependencies [224f7fe]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.5
  - @modern-js/core@1.0.0-rc.5
  - @modern-js/css-config@1.0.0-rc.5
  - @modern-js/babel-chain@1.0.0-rc.5
  - @modern-js/utils@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- fix server route match
- 204c626: feat: initial
- Updated dependencies [undefined]
- Updated dependencies [204c626]
  - @modern-js/babel-preset-app@1.0.0-rc.4
  - @modern-js/core@1.0.0-rc.4
  - @modern-js/css-config@1.0.0-rc.4
  - @modern-js/babel-chain@1.0.0-rc.4
  - @modern-js/utils@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- feat: initial
- Updated dependencies [undefined]
  - @modern-js/babel-preset-app@1.0.0-rc.3
  - @modern-js/core@1.0.0-rc.3
  - @modern-js/css-config@1.0.0-rc.3
  - @modern-js/babel-chain@1.0.0-rc.3
  - @modern-js/utils@1.0.0-rc.3
