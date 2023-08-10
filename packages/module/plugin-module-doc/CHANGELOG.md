# @modern-js/plugin-module-doc

## 2.30.0

### Patch Changes

- Updated dependencies [ddb78ab]
- Updated dependencies [0bc2f66]
- Updated dependencies [c03be09]
- Updated dependencies [cb7961b]
  - @modern-js/doc-core@2.30.0
  - @modern-js/doc-plugin-preview@2.30.0
  - @modern-js/module-tools@2.30.0
  - @modern-js/doc-plugin-api-docgen@2.30.0

## 2.29.0

### Patch Changes

- Updated dependencies [3701a1a]
- Updated dependencies [6993eb6]
- Updated dependencies [b4f2f01]
- Updated dependencies [0f680ec]
- Updated dependencies [2bec7fd]
  - @modern-js/doc-core@2.29.0
  - @modern-js/module-tools@2.29.0
  - @modern-js/doc-plugin-api-docgen@2.29.0
  - @modern-js/doc-plugin-preview@2.29.0

## 2.28.0

### Minor Changes

- b58b1e9: feat(plugin-module-doc): control the need to provide a default value for sidebar by useModuleSidebar
  feat(plugin-module-doc): 通过 useModuleSidebar 来控制是否需要提供 sidebar 的默认值

### Patch Changes

- 9172b5a: fix: change logic about auto sidebar, traverse lang dir when it exists
  fix: 更改自动侧边栏的逻辑,当 lang 目录存在时遍历它
- fc5269e: fix: support module sidebar when user don't have zh or en dir in root
  fix: 当用户没有 zh 或者 en 目录时，仍然支持 module sidebar
- d3e52e4: chore(CI): update build config to improve vitest CI perf

  chore(CI): 更新构建配置来提升 vitest CI 性能

- Updated dependencies [3092f1f]
- Updated dependencies [35ab8e9]
- Updated dependencies [118c1c0]
- Updated dependencies [a497fdc]
- Updated dependencies [90ce6d6]
- Updated dependencies [7412f09]
- Updated dependencies [d5beb73]
- Updated dependencies [be4b5e7]
- Updated dependencies [2a3f537]
- Updated dependencies [7813d17]
- Updated dependencies [b7a8c43]
- Updated dependencies [b0caaf6]
- Updated dependencies [d3e52e4]
- Updated dependencies [9fc3a6e]
  - @modern-js/module-tools@2.28.0
  - @modern-js/doc-plugin-preview@2.28.0
  - @modern-js/doc-core@2.28.0
  - @modern-js/doc-plugin-api-docgen@2.28.0

## 2.27.0

### Minor Changes

- e23a84c: feat: support parseToolOptions for api docgen
  feat: 给 API 文档生成器提供解析器参数
- d00abe7: feat: improve entries that can support indicate parse tool
  feat： 支持在 entries 里面指定解析工具

### Patch Changes

- 1ce4882: feat: support update api doc in dev mode
  feat: 支持 dev 模式下更新 API 文档
- 8322a51: chore: migrate packages from tsc to module-lib build

  chore: 将使用 tsc 的包迁移到 module-lib 构建

- 954d48e: fix: set locales undefined by default
  fix: 默认情况下设置 locales 为空
- Updated dependencies [1ce4882]
- Updated dependencies [787ed4b]
- Updated dependencies [5dabe04]
- Updated dependencies [e23a84c]
- Updated dependencies [1895198]
- Updated dependencies [6af7fe0]
- Updated dependencies [0221d29]
- Updated dependencies [d00abe7]
  - @modern-js/doc-plugin-api-docgen@2.27.0
  - @modern-js/doc-core@2.27.0
  - @modern-js/module-tools@2.27.0
  - @modern-js/doc-plugin-preview@2.27.0

## 2.26.0

### Patch Changes

- Updated dependencies [39f3c83]
- Updated dependencies [ce6d481]
- Updated dependencies [54c484c]
- Updated dependencies [b2cf922]
- Updated dependencies [cc2e3b7]
- Updated dependencies [757485e]
- Updated dependencies [a0a207d]
- Updated dependencies [ee5a6f3]
- Updated dependencies [6387971]
  - @modern-js/doc-core@2.26.0
  - @modern-js/module-tools@2.26.0
  - @modern-js/doc-plugin-preview@2.26.0
  - @modern-js/doc-plugin-api-docgen@2.26.0

## 2.25.2

### Patch Changes

- Updated dependencies [a2a5bcd]
- Updated dependencies [0b3bba7]
- Updated dependencies [2c82d4a]
- Updated dependencies [a44aac7]
- Updated dependencies [3973a72]
- Updated dependencies [0499ff8]
- Updated dependencies [272646c]
- Updated dependencies [a44aac7]
- Updated dependencies [5e2908c]
  - @modern-js/module-tools@2.25.2
  - @modern-js/doc-core@2.25.2
  - @modern-js/doc-plugin-api-docgen@2.25.2
  - @modern-js/doc-plugin-preview@2.25.2

## 2.25.1

### Patch Changes

- c3d6d66: chore: use doc-plugin-api-docgen instead of doc-plugin-api-generator
  chore: 使用 doc-plugin-api-docgen 替代 doc-plugin-api-generator
- 3994b07: fix: move arco to dep from devDep, let global compoennts can resolve it
  fix: 将 arco 从 devDep 移到 dep 里，使得全局组件能够加载到它
- Updated dependencies [273e3cd]
  - @modern-js/module-tools@2.25.1
  - @modern-js/doc-core@2.25.1
  - @modern-js/doc-plugin-api-docgen@2.25.1
  - @modern-js/doc-plugin-preview@2.25.1

## 2.25.0

### Patch Changes

- 10572f3: chore(module-tools): reduce some sub-dependencies

  chore(module-tools): 优化一些子依赖

- 1e35251: refactor: separate api generator from module doc and refactor with global components
  refactor: 将 api 生成功能从模块文档插件中分离出来，并以全局组件的形式重构
- Updated dependencies [9aa2c25]
- Updated dependencies [9ca6671]
- Updated dependencies [4d47773]
- Updated dependencies [b4d2fa2]
- Updated dependencies [cd1bd19]
- Updated dependencies [a71a394]
- Updated dependencies [b40280c]
- Updated dependencies [ec716ea]
- Updated dependencies [b4b0f9f]
- Updated dependencies [1e35251]
- Updated dependencies [62c2cda]
- Updated dependencies [7f8c12b]
- Updated dependencies [c179cbd]
- Updated dependencies [d287b7f]
  - @modern-js/module-tools@2.25.0
  - @modern-js/doc-core@2.25.0
  - @modern-js/doc-plugin-preview@2.25.0
  - @modern-js/doc-plugin-api-generator@3.1.25

## 2.24.0

### Patch Changes

- Updated dependencies [53ba418]
- Updated dependencies [af9af0f]
- Updated dependencies [2858c11]
- Updated dependencies [3b82675]
- Updated dependencies [7073297]
- Updated dependencies [cdb88da]
  - @modern-js/module-tools@2.24.0
  - @modern-js/doc-plugin-preview@2.24.0
  - @modern-js/doc-core@2.24.0

## 2.23.1

### Patch Changes

- 496ec52: fix(module-doc): api params break

  fix(module-doc): api 参数错误

- Updated dependencies [496ec52]
  - @modern-js/doc-core@2.23.1
  - @modern-js/module-tools@2.23.1
  - @modern-js/doc-plugin-preview@2.23.1

## 2.23.0

### Patch Changes

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- 85f9b19: fix: adjust merge doc config logic, support to use custom locales
  fix: 调整合并文档配置的逻辑,支持用户自定义 locales
- 6c95e2b: refactor: adjust default sidebar and overview component, support auto sidebar by dir and remove overview title, divider and list data which from sidebar data.
  refactor: 调整默认 sidebar 和 overview 组件，支持根据文档目录自动生成 sidebar，移除了 overview 组件的标题、分割线以及从 sidebar 数据里拿到的列表数据
- Updated dependencies [02e8d2e]
- Updated dependencies [5d6652c]
- Updated dependencies [090c9c3]
- Updated dependencies [074978b]
- Updated dependencies [7e6fb5f]
- Updated dependencies [12a5bb2]
- Updated dependencies [21b7f86]
- Updated dependencies [ee10c09]
- Updated dependencies [d1ef55f]
- Updated dependencies [689d223]
- Updated dependencies [836da92]
- Updated dependencies [5eba3a9]
- Updated dependencies [ad75a6e]
  - @modern-js/doc-plugin-preview@2.23.0
  - @modern-js/doc-core@2.23.0
  - @modern-js/module-tools@2.23.0

## 2.22.1

### Patch Changes

- eaf2698: fix: enhance the weight of custom global css
  fix: 提高自定义全局 css 样式的权重
- Updated dependencies [eaf2698]
- Updated dependencies [a9009ee]
- Updated dependencies [af75f6d]
- Updated dependencies [eaf2698]
- Updated dependencies [9f732e0]
- Updated dependencies [9093c4e]
- Updated dependencies [903de0f]
- Updated dependencies [dba893f]
- Updated dependencies [c290b9c]
- Updated dependencies [1f02cd2]
- Updated dependencies [0a5e2ef]
  - @modern-js/doc-plugin-preview@2.22.1
  - @modern-js/doc-core@2.22.1
  - @modern-js/module-tools@2.22.1

## 2.22.0

### Minor Changes

- e465c68: feat: refactor and support two preview mode
  feat: 重构并支持两种预览模式

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- Updated dependencies [3d48836]
- Updated dependencies [e465c68]
- Updated dependencies [80d7bba]
- Updated dependencies [d19dc11]
- Updated dependencies [c890980]
- Updated dependencies [e465c68]
- Updated dependencies [7b25598]
- Updated dependencies [562ba82]
- Updated dependencies [68333c8]
- Updated dependencies [4b7488c]
- Updated dependencies [60fddc8]
- Updated dependencies [b371c97]
- Updated dependencies [271f2c1]
  - @modern-js/doc-plugin-preview@2.22.0
  - @modern-js/doc-core@2.22.0
  - @modern-js/module-tools@2.22.0

## 2.21.1

### Patch Changes

- Updated dependencies [9503a5e]
  - @modern-js/doc-core@2.21.1
  - @modern-js/module-tools@2.21.1

## 2.21.0

### Patch Changes

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- Updated dependencies [df43559]
- Updated dependencies [fdb0406]
- Updated dependencies [26dcf3a]
- Updated dependencies [0dd531a]
- Updated dependencies [0a6b969]
- Updated dependencies [8007951]
- Updated dependencies [ad78387]
  - @modern-js/module-tools@2.21.0
  - @modern-js/doc-core@2.21.0

## 2.20.0

### Patch Changes

- 2c3f566: chore: add root and ensure vm path
  chore: 添加 root 和确认虚拟模块路径
- Updated dependencies [09c7af6]
- Updated dependencies [0ce52ad]
- Updated dependencies [d714326]
- Updated dependencies [6b9d90a]
- Updated dependencies [6b9d90a]
  - @modern-js/doc-core@2.20.0
  - @modern-js/module-tools@2.20.0

## 2.19.1

### Patch Changes

- @modern-js/doc-core@2.19.1
- @modern-js/module-tools@2.19.1

## 2.19.0

### Patch Changes

- Updated dependencies [7c234b5]
- Updated dependencies [9fe6499]
- Updated dependencies [c8ba482]
  - @modern-js/doc-core@2.19.0
  - @modern-js/module-tools@2.19.0

## 2.18.1

### Patch Changes

- c911ca5: feat: code block support scroll,dark mode and improve the experience
  feat: 代码块区域支持滚动以及暗黑模式并且提升开发体验
- Updated dependencies [3f35bdc]
- Updated dependencies [5c56edd]
- Updated dependencies [a784fcd]
- Updated dependencies [cdc9db1]
- Updated dependencies [b161968]
  - @modern-js/doc-core@2.18.1
  - @modern-js/module-tools@2.18.1

## 2.18.0

### Patch Changes

- Updated dependencies [2034e01]
- Updated dependencies [f65d3e8]
- Updated dependencies [77932c1]
  - @modern-js/doc-core@2.18.0
  - @modern-js/module-tools@2.18.0

## 2.17.1

### Patch Changes

- ee40be9: fix: use dynamic import doc-core
  fix: 使用动态引用 doc-core
- 7cca880: fix: use mergeDocConfig to merge modern doc config
  fix: 支持 mergeDocConfig 合并 modern doc 的配置
- Updated dependencies [846590d]
- Updated dependencies [e3733a3]
- Updated dependencies [ecdcd71]
- Updated dependencies [01b4e32]
- Updated dependencies [01b4e32]
- Updated dependencies [06dd14e]
- Updated dependencies [8b7f7f2]
- Updated dependencies [cb3cc7f]
- Updated dependencies [e3733a3]
  - @modern-js/doc-core@2.17.1
  - @modern-js/module-tools@2.17.1

## 2.17.0

### Patch Changes

- c76a80b: fix: replace line in table content and optimize error treatment,log info
  fix: 替换表格里的竖线并且优化错误处理和输出信息
- Updated dependencies [85fb207]
- Updated dependencies [cb52e34]
  - @modern-js/doc-core@2.17.0
  - @modern-js/module-tools@2.17.0

## 2.16.0

### Patch Changes

- f02c98a: fix: make plugin options optional
  fix: 使插件参数变为可选项
- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- a824aad: fix: get lang from useLang not pageData
  fix: 使用 useLang 获取 lang
- Updated dependencies [f15fe5a]
- Updated dependencies [cd0bc21]
- Updated dependencies [b06f571]
- Updated dependencies [5cd8527]
- Updated dependencies [acc0a00]
- Updated dependencies [628be4b]
- Updated dependencies [ddc066d]
- Updated dependencies [fd4a8a6]
- Updated dependencies [4e876ab]
- Updated dependencies [9eec77b]
- Updated dependencies [355d36e]
- Updated dependencies [b06f571]
- Updated dependencies [6b905d5]
- Updated dependencies [b16de50]
- Updated dependencies [a824aad]
- Updated dependencies [6f3548a]
  - @modern-js/doc-core@2.16.0
  - @modern-js/module-tools@2.16.0

## 2.15.0

### Patch Changes

- Updated dependencies [81bf045]
  - @modern-js/doc-core@2.15.0
  - @modern-js/module-tools@2.15.0

## 2.14.0

### Patch Changes

- Updated dependencies [f08f3ab]
- Updated dependencies [d27fae0]
- Updated dependencies [7b002f4]
- Updated dependencies [7423070]
- Updated dependencies [432ac8b]
- Updated dependencies [16399fd]
- Updated dependencies [e627657]
  - @modern-js/module-tools@2.14.0
  - @modern-js/doc-core@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/doc-core@2.13.4
- @modern-js/module-tools@2.13.4

## 2.13.3

### Patch Changes

- Updated dependencies [c20e67d]
  - @modern-js/module-tools@2.13.3
  - @modern-js/doc-core@2.13.3

## 2.13.2

### Patch Changes

- 6107696: fix: export PluginOptions type in module-doc

  fix: 从 module-doc 中导出 PluginOptions 类型

- Updated dependencies [3d68bd3]
- Updated dependencies [3867ab5]
  - @modern-js/doc-core@2.13.2
  - @modern-js/module-tools@2.13.2

## 2.13.1

### Patch Changes

- @modern-js/doc-core@2.13.1
- @modern-js/module-tools@2.13.1

## 2.13.0

### Minor Changes

- 1897e83: refactor: remove inject template and unuse config, add internal compoennt named overview
  refactor: 移除插入模板的逻辑和无用的配置，并添加内置概览组件

### Patch Changes

- Updated dependencies [1897e83]
- Updated dependencies [c04925b]
- Updated dependencies [8b45566]
- Updated dependencies [034f36b]
- Updated dependencies [e3291d5]
- Updated dependencies [6d3b023]
- Updated dependencies [bb03c20]
- Updated dependencies [88faab3]
- Updated dependencies [034f36b]
- Updated dependencies [79bc089]
- Updated dependencies [72b71b5]
  - @modern-js/doc-core@2.13.0
  - @modern-js/module-tools@2.13.0

## 2.12.0

### Patch Changes

- 979b15f: chore: remove to module folder
  chore: 移动至 module 文件夹
- Updated dependencies [ca8774e]
- Updated dependencies [af705fa]
- Updated dependencies [6d86e34]
- Updated dependencies [809ca3a]
- Updated dependencies [9328fb9]
- Updated dependencies [d9bcc86]
- Updated dependencies [0baa168]
- Updated dependencies [5495f1d]
- Updated dependencies [1cdb379]
- Updated dependencies [3936535]
- Updated dependencies [bffd8f7]
- Updated dependencies [8a3fbbd]
- Updated dependencies [8bc2d12]
- Updated dependencies [a110563]
- Updated dependencies [240906b]
  - @modern-js/doc-core@2.12.0
  - @modern-js/module-tools@2.12.0

## 2.11.0

### Patch Changes

- 94c41ad: fix: fix base
  fix: 修复 base 配置
- Updated dependencies [1adb131]
- Updated dependencies [800ca61]
- Updated dependencies [aa0a312]
- Updated dependencies [6118636]
- Updated dependencies [95dd73e]
- Updated dependencies [2c05cb8]
- Updated dependencies [8ebf399]
- Updated dependencies [f1b2629]
  - @modern-js/doc-core@2.11.0
  - @modern-js/module-tools@2.11.0

## 2.10.0

### Minor Changes

- cf7439c: feat: support plugin in module-tools
  feat: 支持模块工程插件

### Patch Changes

- fe34d1a: fix: api lang and merge doc logic
  fix: API 组件的语言切换以及文档配置合并逻辑
- 2b48ed1: fix: update arco-design version
  fix: 升级 arco-design 的版本
- 6d08d08: fix: fix globalStyle path
  fix: 修复全局样式文件路径
- Updated dependencies [c413d79]
- Updated dependencies [0da32d0]
- Updated dependencies [135b8e9]
- Updated dependencies [785011b]
- Updated dependencies [2f9d8de]
- Updated dependencies [07780f4]
- Updated dependencies [e8ed464]
- Updated dependencies [cf7439c]
- Updated dependencies [90f2262]
- Updated dependencies [61aa5cb]
- Updated dependencies [19e552a]
  - @modern-js/doc-core@2.10.0
  - @modern-js/module-tools@2.10.0
