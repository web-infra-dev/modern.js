# @modern-js/webpack

## 1.12.1

### Patch Changes

- 6980b96c0: hotfix: fix webpack js/ts module.rule config of the plugin storybook
  hotfix: 修复 storybook 的对于 js/ts 的 webpack module.rule 配置

## 1.12.0

### Minor Changes

- 33cebd2: chore(babel-chain): merge `@modern-js/babel-chain` to `@modern-js/babel-preset-base`

  chore(babel-chain): 合并 `@modern-js/babel-chain` 到 `@modern-js/babel-preset-base`

### Patch Changes

- b74b0b6: fix(webpack): failed to analyze bundle

  fix(webpack): 修复使用 bundle analyze 时报错的问题

- 8b2aa56: perf(webpack): improve getSourceInclude performance

  perf(webpack): 优化 getSourceInclude 执行性能

- 3e4a34f: fix(webpack): failed to compile .cjs,.cts,.mts file

  fix(webpack): 修复无法编译 .cjs,.cts,.mts 文件的问题

- Updated dependencies [33cebd2]
  - @modern-js/babel-preset-app@1.5.0
  - @modern-js/css-config@1.2.8
  - @modern-js/utils@1.7.12

## 1.11.5

### Patch Changes

- dc4676b: chore(webpack): refactor webpack config, split modules
- 80b47bc: perf(webpack): optimize terser default options

  perf(webpack): 优化 Terser 默认压缩配置，提升压缩率

- 572d63b: fix(webpack): should not inject CSS sourcemap in js bundles

  fix(webpack): 修复使用 style-loader 时会将 CSS 的 SourceMap 打包到 JS 中的问题

- 7124323: fix(webpack): failed to import SVG from a CSS file in some cases

  fix(webpack): 修复从 CSS 文件中引用 SVG 图片时，可能会出现编译报错的问题

- Updated dependencies [dc4676b]
- Updated dependencies [4a7f2a2]
  - @modern-js/utils@1.7.12
  - @modern-js/css-config@1.2.8

## 1.11.3

### Patch Changes

- 550e2bd: feat(webpack): prebundle css-loader
- 87eb9f8: perf(webpack): lazy require plugins to improve boot time
- 2b06fe3: feat(webpack): only display error messages of type checker
- 3050acc: fix resolve alias real path
- 338496c: fix(webpack): webpackChunkName magic comments not work
- Updated dependencies [a90bc96]
  - @modern-js/utils@1.7.9
  - @modern-js/babel-preset-app@1.4.2
  - @modern-js/css-config@1.2.7

## 1.11.2

### Patch Changes

- 8d0eb81f5: fix resolve alias real path

## 1.11.1

### Patch Changes

- 06b411dc3: fix(webpack): only apply module scope plugin when user config contains moduleScope
- 5d4806f86: fix(webpack): failed to display compile time in CI environment
- 4165e50c7: feat(webpack): copy plugin skip minification of .min.js file
- 073e9ad78: feat(webpack): improve utils of tools.webpack
- cda99c441: fix(webpack): should exclude api folder from babel-loader
- b96dcf364: fix ssr entry filter logic
- 9e36d3a01: fix: condition of babel-loader and ts-loader.
- Updated dependencies [63c354ad5]
- Updated dependencies [12fc5ac88]
- Updated dependencies [073e9ad78]
- Updated dependencies [f4a7d49e1]
- Updated dependencies [97bb6adb9]
  - @modern-js/babel-preset-app@1.4.2
  - @modern-js/utils@1.7.8
  - @modern-js/css-config@1.2.7

## 1.11.0

### Minor Changes

- 8e1cedd8a: feat(webpack): support addIncludes and addExcludes in tools.tsLoader

### Patch Changes

- ded45811c: chore: fix tools.webpack type issue
- 9d649884b: fix(webpack): tsconfig paths should work with files in node_modules
- 9377d2d9d: feat: support addPlugins util in tools.postcss
- 6b2523f44: fix(webpack): incorrect babel loader options for node target
- b7a1cea52: feat: support utils in tools.babel
- Updated dependencies [9377d2d9d]
- Updated dependencies [8c9ad1749]
- Updated dependencies [b7a1cea52]
- Updated dependencies [3dfee700c]
  - @modern-js/css-config@1.2.7
  - @modern-js/utils@1.7.7
  - @modern-js/babel-preset-app@1.4.1

## 1.10.0

### Minor Changes

- a1198d509: fix: regenerator-runtime is bundled twice

### Patch Changes

- 8d508c6ed: feat(devServer): support disable hmr or live reload
- a1198d509: feat: bump babel 7.18.0
- 29728812e: fix(webpack): fix useBuiltIns entry not work, reduce bundle size
- 147e090f7: fix(webpack): fix loaders order
- 18892c65c: feat(webpack): optimize webpack config
- Updated dependencies [a1198d509]
- Updated dependencies [a1198d509]
  - @modern-js/babel-preset-app@1.4.0
  - @modern-js/babel-chain@1.2.5
  - @modern-js/css-config@1.2.6

## 1.9.1

### Patch Changes

- 6c8ab42dd: optimize whether to do SSR bundle
- ed90859ba: fix: failed to compile css modules in node_modules
- 0ef2431cb: chore(webpack): refactor publicPath setter

## 1.9.0

### Minor Changes

- 0d161fa8: feat(webpack): add more utils for tools.webpack
- 280eebf9: feat(webpack): tools.webpack support modify or return config object

### Patch Changes

- 5f7fccf0: feat(webpack): check argument type in webpack utils
- 02b0a22e: fix(webpack): ts checker skip api folder
- da65bf12: chore: merge plugin-fast-refresh into webpack
- 8854c600: use webpack chain to add target
- f7cbc771: feat: prebundle webpack-dev-middleware
- 6451a098: fix: cyclic dependencies of @modern-js/core and @moden-js/webpack
- f5c48c3f: fix(webpack): ts checker should ignore node_modules
- 658b4dd5: fix(webpack): ts checker runs twice when ssr is enabled
- 45d5643a: feat(webpack): support modify html-webpack-plugin
- 2ba8d62f: feat: filter ssr bundles by server.ssrByEntries
- 7394df61: feat: prebundle @loadable/webpack-plugin and fix peer deps warning
- Updated dependencies [6451a098]
- Updated dependencies [0276ffa2]
- Updated dependencies [d5a2cfd8]
- Updated dependencies [437367c6]
  - @modern-js/utils@1.7.6
  - @modern-js/babel-preset-app@1.3.4
  - @modern-js/css-config@1.2.6

## 1.8.0

### Minor Changes

- f66fa0e98: feat: support tools.webpackChain config

### Patch Changes

- 119cd4b89: support globalVars in ssr
- f1c889e7a: fix(webpack): failed to transform css when disableCssModuleExtension is true
- b6443bff7: chore(webpack): remove unnecessary plugin type
- 1dfe08fcd: feat(webpack): add CHAIN_ID constants for webpack chain
- 01e755d1c: feat(webpack): make module-scope-plugin 10x faster
- Updated dependencies [e33bd91f7]
- Updated dependencies [33de0f7ec]
  - @modern-js/babel-chain@1.2.4
  - @modern-js/utils@1.7.5
  - @modern-js/babel-preset-app@1.3.3
  - @modern-js/css-config@1.2.6

## 1.7.1

### Patch Changes

- b8cfc42cd: feat: prebundle tsconfig-paths and nanoid
- 123532bab: fix(webpack): webpack watch mode rebuild twice on file change
- Updated dependencies [b8cfc42cd]
- Updated dependencies [804a5bb8a]
- Updated dependencies [602299a4d]
  - @modern-js/utils@1.7.4
  - @modern-js/babel-preset-app@1.3.3
  - @modern-js/css-config@1.2.6

## 1.7.0

### Minor Changes

- 47934c4da: feat: bump @svgr/webpack from v5 to v6

### Patch Changes

- d2995e7d7: fix: should not trigger recompile after running dev command
- d32f35134: chore: add modern/jest/eslint/ts config files to .npmignore
- b1f7d2aa6: fix: remove console polyfill for performance
- 97086dde8: remove code
- 97086dde8: fix ssr data structure
- 97086dde8: passing ssrContext to App.init
- ff6219909: fix(webpack): tools.polyfill usage not work
- Updated dependencies [d32f35134]
- Updated dependencies [6ae4a34ae]
- Updated dependencies [b80229c79]
- Updated dependencies [1a30be07b]
- Updated dependencies [948cc4436]
  - @modern-js/babel-preset-app@1.3.2
  - @modern-js/css-config@1.2.6
  - @modern-js/babel-chain@1.2.3
  - @modern-js/utils@1.7.3

## 1.6.2

### Patch Changes

- b7b8075dc: feat: bump html-loader from v2 to v3
- 0e0537005: fix: unlock @babel/core version
- 738c55d39: fix: incorrect tapable version in some cases
- 69a728375: fix: remove exports.jsnext:source after publish
- Updated dependencies [cd7346b0d]
- Updated dependencies [0e0537005]
- Updated dependencies [69a728375]
  - @modern-js/utils@1.7.2
  - @modern-js/babel-preset-app@1.3.1
  - @modern-js/css-config@1.2.5

## 1.6.0

### Minor Changes

- 0ee4bb4e: feat: prebundle webpack loaders and plugins

### Patch Changes

- 4697d1db: fix: remove webpack-node-external for server bundle
- Updated dependencies [0ee4bb4e]
- Updated dependencies [6fa74d5f]
  - @modern-js/babel-preset-app@1.3.0
  - @modern-js/utils@1.7.0
  - @modern-js/css-config@1.2.4

## 1.5.7

### Patch Changes

- a0475f1a: fix: missing @babel/core peer dependencies
- 123e432d: uglify ssr bundle for treeshaking
- 71526621: fix: remove unused babel cache
- 77519490: refactor(webpack): remove `@modern-js/core`
- 3578716a: fix(webpack): failed to read property of compileOptions
- 895fa0ff: chore: using "workspace:\*" in devDependencies
- 3d1fac2a: chore: app-tools no longer depend on webpack
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
  - @modern-js/babel-preset-app@1.2.7
  - @modern-js/css-config@1.2.4

## 1.5.5

### Patch Changes

- 6cffe99d: chore:
  remove react eslint rules for `modern-js` rule set.
  add .eslintrc for each package to speed up linting
- 04ae5262: chore: bump @modern-js/utils to v1.4.1 in dependencies
- 60f7d8bf: feat: add tests dir to npmignore
- e4cec1ce: types: fix config hook type
- Updated dependencies [a4330c73]
- Updated dependencies [b8599d09]
- Updated dependencies [6cffe99d]
- Updated dependencies [04ae5262]
- Updated dependencies [60f7d8bf]
- Updated dependencies [e4cec1ce]
- Updated dependencies [3b7aa8bb]
- Updated dependencies [5dbbeb57]
- Updated dependencies [ebfcbb35]
- Updated dependencies [3bf4f8b0]
- Updated dependencies [305e0bb4]
  - @modern-js/core@1.8.0
  - @modern-js/utils@1.5.0
  - @modern-js/babel-preset-app@1.2.7
  - @modern-js/css-config@1.2.4
  - @modern-js/babel-chain@1.2.2

## 1.5.4

### Patch Changes

- ec1b7367: fix: tools config types
- 17d0cc46: feat: prebundle lodash to @modern-js/utils/lodash
- Updated dependencies [60855eb2]
- Updated dependencies [ec1b7367]
- Updated dependencies [77ff9754]
- Updated dependencies [d2d1d6b2]
- Updated dependencies [07a4887e]
- Updated dependencies [ea2ae711]
- Updated dependencies [17d0cc46]
- Updated dependencies [d2d1d6b2]
  - @modern-js/core@1.7.0
  - @modern-js/utils@1.4.0
  - @modern-js/babel-preset-app@1.2.6
  - @modern-js/css-config@1.2.3

## 1.5.3

### Patch Changes

- bebb39b6: chore: improve devDependencies and peerDependencies
- 4b4e73b7: feat: enable css extract in dev mode by default.
- da60172c: style-loader should never use ssr bundle
- 6cff93dc: chore: bump webpack and esbuild version
- 9d4a005b: fix: config babel via tools.babel
- Updated dependencies [bebb39b6]
- Updated dependencies [ef28a4e6]
- Updated dependencies [132f7b53]
- Updated dependencies [9d4a005b]
  - @modern-js/css-config@1.2.3
  - @modern-js/core@1.6.1
  - @modern-js/utils@1.3.7
  - @modern-js/babel-preset-app@1.2.5

## 1.5.0

### Minor Changes

- 66cbef42: support disableCssExtract

### Patch Changes

- Updated dependencies [05ce88a0]
- Updated dependencies [a8df060e]
- Updated dependencies [c2046f37]
- Updated dependencies [6a7acb81]
- Updated dependencies [4e2026e4]
  - @modern-js/core@1.6.0
  - @modern-js/utils@1.3.6

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
