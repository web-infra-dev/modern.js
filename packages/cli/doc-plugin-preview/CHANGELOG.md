# @modern-js/doc-plugin-preview

## 2.26.0

### Patch Changes

- 757485e: fix: can not find path only in windows bacause of the escape char
  fix: 在 windows 系统下因为转义字符而无法找到路径
- Updated dependencies [39f3c83]
- Updated dependencies [ce6d481]
- Updated dependencies [b2cf922]
- Updated dependencies [757485e]
- Updated dependencies [a0a207d]
- Updated dependencies [ee5a6f3]
- Updated dependencies [6387971]
  - @modern-js/doc-core@2.26.0
  - @modern-js/utils@2.26.0

## 2.25.2

### Patch Changes

- a44aac7: feat(doc-core): support preview for pages added in `addPages` hook

  feat(doc-core): 支持为 `addPages` 钩子新增的页面添加预览功能

- Updated dependencies [0b3bba7]
- Updated dependencies [63d8247]
- Updated dependencies [6651684]
- Updated dependencies [2c82d4a]
- Updated dependencies [a44aac7]
- Updated dependencies [3973a72]
- Updated dependencies [0499ff8]
- Updated dependencies [272646c]
- Updated dependencies [a44aac7]
- Updated dependencies [358ed24]
- Updated dependencies [5e2908c]
  - @modern-js/doc-core@2.25.2
  - @modern-js/utils@2.25.2

## 2.25.1

### Patch Changes

- Updated dependencies [9f78d0c]
  - @modern-js/utils@2.25.1
  - @modern-js/doc-core@2.25.1

## 2.25.0

### Minor Changes

- a71a394: feat: add DemoBlock for preview in mobile mode
  feat: 提供 DemoBlock 组件给移动端预览模式

### Patch Changes

- b40280c: feat(module-doc): support external demo

  feat(module-doc): 支持外部 demo

- 1e35251: refactor: separate api generator from module doc and refactor with global components
  refactor: 将 api 生成功能从模块文档插件中分离出来，并以全局组件的形式重构
- 62c2cda: fix(module-doc): demo not show in mobile

  fix(module-doc): 修复移动端 demo 不显示问题

- Updated dependencies [9ca6671]
- Updated dependencies [4d47773]
- Updated dependencies [b4d2fa2]
- Updated dependencies [cd1bd19]
- Updated dependencies [ec716ea]
- Updated dependencies [b4b0f9f]
- Updated dependencies [5732c6a]
- Updated dependencies [7f8c12b]
- Updated dependencies [c179cbd]
  - @modern-js/doc-core@2.25.0
  - @modern-js/utils@2.25.0

## 2.24.0

### Minor Changes

- 2858c11: feat: support web and mobile meta for code block to change preview mode
  feat: 支持在代码块添加 web 和 mobile meta 来更改预览模式

### Patch Changes

- af9af0f: fix(doc-core): doc hmr invalid

  fix(doc-core): 文档热更新失效

- Updated dependencies [c882fbd]
- Updated dependencies [af9af0f]
- Updated dependencies [4a82c3b]
- Updated dependencies [cdb88da]
  - @modern-js/utils@2.24.0
  - @modern-js/doc-core@2.24.0

## 2.23.1

### Patch Changes

- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [496ec52]
- Updated dependencies [8f2cab0]
  - @modern-js/utils@2.23.1
  - @modern-js/doc-core@2.23.1

## 2.23.0

### Patch Changes

- 02e8d2e: fix: pure is not valid when preview mode is mobile
  fix: pure 在移动端预览模式下不生效
- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- ee10c09: fix: add origin in iframe src
  fix: 在 iframe src 添加 origin 前缀
- 689d223: fix: render demo correctly in prod after normalize demo id
  fix: 规划化 demo id 后，在生产环境正确渲染 demo 组件
- Updated dependencies [5d6652c]
- Updated dependencies [090c9c3]
- Updated dependencies [074978b]
- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [6dec7c2]
- Updated dependencies [12a5bb2]
- Updated dependencies [c3216b5]
- Updated dependencies [836da92]
- Updated dependencies [5eba3a9]
- Updated dependencies [ad75a6e]
  - @modern-js/doc-core@2.23.0
  - @modern-js/utils@2.23.0

## 2.22.1

### Patch Changes

- eaf2698: fix: ensure dir before write virtual demo and add package.json files
  fix: 写入虚拟 demo 时确保目录存在并给 package.json 添加 files 字段
- eaf2698: fix: enhance the weight of custom global css
  fix: 提高自定义全局 css 样式的权重
- dba893f: fix: 404 error caused by not validate id in demo component
  fix: 在 demo 组件里 id 未合法化导致的 404 错误
- Updated dependencies [a9009ee]
- Updated dependencies [af75f6d]
- Updated dependencies [e2848a2]
- Updated dependencies [9f732e0]
- Updated dependencies [9093c4e]
- Updated dependencies [903de0f]
- Updated dependencies [c290b9c]
- Updated dependencies [d4045ed]
- Updated dependencies [1f02cd2]
- Updated dependencies [0a5e2ef]
  - @modern-js/doc-core@2.22.1
  - @modern-js/utils@2.22.1

## 2.22.0

### Minor Changes

- e465c68: feat: init and support preview component
  feat: 新增插件并支持预览组件

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- 68333c8: fix(doc-core): demo preview ssg

  fix(doc-core): demo 预览 SSG 失败的问题

- 271f2c1: fix(doc-plugin-preview): preview plugin build error

  fix(doc-plugin-preview): 预览插件构建错误

- Updated dependencies [3d48836]
- Updated dependencies [80d7bba]
- Updated dependencies [5050e8e]
- Updated dependencies [e465c68]
- Updated dependencies [7b25598]
- Updated dependencies [562ba82]
- Updated dependencies [68333c8]
- Updated dependencies [60fddc8]
- Updated dependencies [b371c97]
- Updated dependencies [271f2c1]
  - @modern-js/utils@2.22.0
  - @modern-js/doc-core@2.22.0
