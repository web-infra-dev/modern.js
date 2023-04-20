# @modern-js/doc-core

## 2.14.0

### Minor Changes

- 16399fd: feat: support extendPageData hook and last updated time

  feat: 支持 extendPageData 钩子和最后更新时间功能

### Patch Changes

- d27fae0: feat: add doc-tools e2e

  feat: 添加 doc-tools e2e 测试用例

- 7b002f4: fix: doc e2e test in windows

  fix: 解决 windows 下 e2e 测试失败的问题

- e627657: fix(doc-core): fix failed to resolve @modern-js/utils/logger

  fix(doc-core): 修复引用 @modern-js/utils/logger 失败的问题

- Updated dependencies [4779152]
- Updated dependencies [fefd1c5]
- Updated dependencies [9321bef]
- Updated dependencies [4baf588]
- Updated dependencies [d0efae3]
- Updated dependencies [9b45c58]
- Updated dependencies [52d0cb1]
- Updated dependencies [60a81d0]
- Updated dependencies [864d55e]
- Updated dependencies [b965df2]
- Updated dependencies [dacef96]
- Updated dependencies [16399fd]
  - @modern-js/utils@2.14.0
  - @modern-js/builder-rspack-provider@2.14.0
  - @modern-js/builder@2.14.0
  - @modern-js/core@2.14.0
  - @modern-js/remark-container@2.14.0

## 2.13.4

### Patch Changes

- @modern-js/builder@2.13.4
- @modern-js/builder-rspack-provider@2.13.4
- @modern-js/core@2.13.4
- @modern-js/remark-container@2.13.4
- @modern-js/utils@2.13.4

## 2.13.3

### Patch Changes

- Updated dependencies [28583e8]
  - @modern-js/builder@2.13.3
  - @modern-js/remark-container@2.13.3
  - @modern-js/builder-rspack-provider@2.13.3
  - @modern-js/core@2.13.3
  - @modern-js/utils@2.13.3

## 2.13.2

### Patch Changes

- 3d68bd3: fix: theme types cannot access

  fix: 主题类型无法访问

- 3867ab5: feat: optimize route isExist logic

  feat: 优化路由 isExist 逻辑

- Updated dependencies [106ac07]
- Updated dependencies [7f4fd56]
  - @modern-js/core@2.13.2
  - @modern-js/remark-container@2.13.2
  - @modern-js/builder@2.13.2
  - @modern-js/builder-rspack-provider@2.13.2
  - @modern-js/utils@2.13.2

## 2.13.1

### Patch Changes

- Updated dependencies [ab79a7b]
  - @modern-js/core@2.13.1
  - @modern-js/remark-container@2.13.1
  - @modern-js/builder@2.13.1
  - @modern-js/builder-rspack-provider@2.13.1
  - @modern-js/utils@2.13.1

## 2.13.0

### Patch Changes

- 1897e83: fix: use display:table in table element
  fix: 使用 display:table 在 table 元素上
- c04925b: fix(doc-core): anchor

  fix(doc-core): 锚点无效

- 8b45566: fix: code highlight & image not show

  fix: 代码高亮失效 & 图片不显示

- e3291d5: feat: redirect locale language in first visit

  feat: 优化首次访问时的语言重定向

- 6d3b023: feat: support fuzzy search for remote search

  feat: 服务端搜索支持模糊搜索

- bb03c20: fix: search broken when search keyword is null

  fix: 搜索关键字为空时搜索过程卡住

- 72b71b5: feat: normalize link and image in mdx-rs

  feat: mdx-rs 中支持 link 和 图片的规范化

- Updated dependencies [1feacdc]
- Updated dependencies [e9b1656]
- Updated dependencies [c89de05]
- Updated dependencies [d69c0b9]
- Updated dependencies [5deb1fb]
- Updated dependencies [348306d]
- Updated dependencies [e91ec97]
- Updated dependencies [9c0572e]
- Updated dependencies [538d1a8]
  - @modern-js/builder@2.13.0
  - @modern-js/core@2.13.0
  - @modern-js/builder-rspack-provider@2.13.0
  - @modern-js/remark-container@2.13.0
  - @modern-js/utils@2.13.0

## 2.12.0

### Patch Changes

- ca8774e: fix: search result not accurate

  fix: 解决搜索结果遗漏的问题

- 6d86e34: feat(doc-tools): print dev server URLs with base

  feat(doc-tools): 输出 dev server 的 URLs 时补全 base 信息

- 809ca3a: fix(doc-core): fix Tabs props type
  fix(doc-core): 修复 Tabs 组件类型
- 9328fb9: feat: prebundle theme

  feat: 预打包主题

- d9bcc86: fix: code highlight

  fix: 代码高亮无效

- 5495f1d: fix: switch lang 404

  fix: 切换语言后 404 问题

- bffd8f7: feat(doc-core): improve dead link log message

  feat(doc-core): 优化死链检测的日志

- a110563: fix: fix darkmode that don't work
  fix: 修复 darkmode 不生效的问题
- 240906b: fix: link base missing

  fix: 链接 base 丢失问题

- Updated dependencies [cd1d966]
- Updated dependencies [c2ca6c8]
- Updated dependencies [6d86e34]
- Updated dependencies [fef3394]
- Updated dependencies [6b30837]
  - @modern-js/builder-rspack-provider@2.12.0
  - @modern-js/utils@2.12.0
  - @modern-js/builder@2.12.0
  - @modern-js/core@2.12.0
  - @modern-js/remark-container@2.12.0

## 2.11.0

### Patch Changes

- 1adb131: feat: support code line highlight

  feat: 支持代码行高亮

- 800ca61: fix: match content result

  fix: 修复搜索错误

- 95dd73e: chore: adjust doc-tools constructor

  chore: 调整 doc-tools 入参

- 2c05cb8: feat: add header anchor in mobile

  feat: 移动端显示 header anchor

- 8ebf399: fix(doc-core): run string-replace-loader before mdx-loader

  fix(doc-core): 在 mdx-loader 之前执行 string-replace-loader

- Updated dependencies [cfb058f]
- Updated dependencies [a9c6083]
- Updated dependencies [55b07fd]
- Updated dependencies [c0ba89b]
- Updated dependencies [0bd018b]
- Updated dependencies [8b90c79]
- Updated dependencies [a8c08c3]
- Updated dependencies [5d624fd]
- Updated dependencies [e2466a1]
- Updated dependencies [02bb383]
- Updated dependencies [3171c9d]
- Updated dependencies [381a3b9]
- Updated dependencies [7a60f10]
- Updated dependencies [cd1040f]
- Updated dependencies [e262a99]
- Updated dependencies [7178795]
- Updated dependencies [1140a69]
- Updated dependencies [b71cef1]
- Updated dependencies [274b2e5]
- Updated dependencies [b9e1c54]
  - @modern-js/builder@2.11.0
  - @modern-js/utils@2.11.0
  - @modern-js/builder-rspack-provider@2.11.0
  - @modern-js/core@2.11.0
  - @modern-js/remark-container@2.11.0

## 2.10.0

### Minor Changes

- cf7439c: feat: export getCustomMDXComponent
  feat: 导出 getCustomMDXComponent

### Patch Changes

- c413d79: feat(doc-tools): support --config CLI option

  feat(doc-tools): 支持 --config CLI 选项

- 135b8e9: feat(doc-core): improve paragraph padding

  feat(doc-core): 优化段落间距

- 785011b: feat(doc-core): improve directive block style

  feat(doc-core): 优化 directive block 的样式

- 2f9d8de: fix(doc-core): fix left sidebar height

  fix(doc-core): 修复左侧 sidebar 高度不足的问题

- 07780f4: fix: nav link normalize

  fix: nav link 规范化

- e8ed464: feat(doc-tools): add a tip when no search result

  feat(doc-tools): 增加无搜索结果时的提示文案

- 90f2262: chore: appearance button position

  chore: 调整主题切换按钮位置

- 61aa5cb: fix(doc-core): fix code background color in containers

  fix(doc-core): 修复 container 中的代码块背景色

- 19e552a: fix: main doc theme

  fix: 首页深色模式问题

- Updated dependencies [a8db932]
- Updated dependencies [0da32d0]
- Updated dependencies [d3f0642]
- Updated dependencies [785011b]
- Updated dependencies [a16b9b0]
- Updated dependencies [0d9962b]
- Updated dependencies [fbefa7e]
- Updated dependencies [4d54233]
- Updated dependencies [6db4864]
- Updated dependencies [cfdbf80]
- Updated dependencies [ed55acb]
  - @modern-js/builder-rspack-provider@2.10.0
  - @modern-js/utils@2.10.0
  - @modern-js/core@2.10.0
  - @modern-js/remark-container@2.10.0
  - @modern-js/builder@2.10.0

## 2.9.0

### Minor Changes

- 8f7d293462: feat: support rspack

  feat: 支持 Rspack 构建

### Patch Changes

- c61aabfbfe: feat: optimize doc ui theme

  feat: 优化文档 UI 主题

- 226ba4b061: fix: mailto url

  fix: 修复 mailto url

- abb0658221: feat: add custom mdx components

  feat: 增加自定义 mdx 组件

- Updated dependencies [76b26883bb]
- Updated dependencies [f31a254d78]
- Updated dependencies [1f047183c3]
- Updated dependencies [88328d914b]
- Updated dependencies [dd56401486]
- Updated dependencies [07569e577e]
- Updated dependencies [da66232feb]
  - @modern-js/builder-rspack-provider@2.9.0
  - @modern-js/builder@2.9.0
  - @modern-js/core@2.9.0
  - @modern-js/remark-container@2.9.0
  - @modern-js/utils@2.9.0

## 2.8.0

### Patch Changes

- f6c9558320: fix: static path miss

  fix: 静态资源路径错误

- 9d1b6f203f: fix: search index not found

  fix: 搜索索引没有找到

- 2c1151271d: fix(builder): fix incorrect browserslist config

  fix(builder): 修复错误的 browserslist 配置

- fcdac2a3df: fix: search index dev middleware

  fix: search index 中间件无效

- b71d66058b: fix: unexpected title

  fix: title 错误问题

- b9874d5b5e: feat: optimize check deak link log

  feat: 优化死链检测日志

- Updated dependencies [65c56f43b9]
- Updated dependencies [bd369a89a4]
- Updated dependencies [1104a9f18b]
- Updated dependencies [2c1151271d]
- Updated dependencies [1f6ca2c7fb]
  - @modern-js/builder-webpack-provider@2.8.0
  - @modern-js/builder@2.8.0
  - @modern-js/utils@2.8.0
  - @modern-js/remark-container@2.8.0
  - @modern-js/core@2.8.0
