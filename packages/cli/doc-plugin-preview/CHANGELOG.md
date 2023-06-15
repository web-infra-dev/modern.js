# @modern-js/doc-plugin-preview

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
