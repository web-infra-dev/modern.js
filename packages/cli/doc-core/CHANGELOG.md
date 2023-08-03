# @modern-js/doc-core

## 2.29.0

### Patch Changes

- 3701a1a: feat(doc-core): support builder plugins

  feat(doc-core): 支持 builder plugins 配置

- b4f2f01: fix(doc-core): search type

  fix(doc-core): 修复 search 类型

- 2bec7fd: feat(doc-core): support tag config in navbar and sidebar

  feat(doc-core): 支持 navbar 和 sidebar 中的 tag 配置

- Updated dependencies [e6b5355]
- Updated dependencies [93db783]
- Updated dependencies [1d420ae]
- Updated dependencies [1171338]
- Updated dependencies [3e0e1b2]
- Updated dependencies [cba7675]
- Updated dependencies [99052ea]
- Updated dependencies [2ad31da]
- Updated dependencies [1d71d2e]
  - @modern-js/utils@2.29.0
  - @modern-js/builder-rspack-provider@2.29.0
  - @modern-js/builder@2.29.0
  - @modern-js/core@2.29.0
  - @modern-js/doc-plugin-medium-zoom@2.29.0
  - @modern-js/remark-container@2.29.0

## 2.28.0

### Patch Changes

- a497fdc: feat(doc-core): add modern-doc-container class

  feat(doc-core): 添加 modern-doc-container 类

- 90ce6d6: chore(doc-core): bump mdx-rs-binding to 0.2.3
- 7412f09: fix(doc-core): prefer mjs
- d5beb73: fix(doc-core): use routePath for page key

  fix(doc-core): 使用 routePath 作为页面 key

- be4b5e7: fix: empty temp dir before build
  fix: 在构建之前清空 temp 目录
- 2a3f537: fix(doc-core): redirect to incorrect language page

  fix(doc-core): 重定向不存在的语言页面

- 7813d17: fix(doc-core): clear the compile-time path in output bundle to avoid internal path exposure

  fix(doc-core): 在输出的 bundle 中清除编译时的路径以避免暴露内网路径

- b0caaf6: feat(doc-core): support user custom mdx components

  feat(doc-core): 支持用户自定义 mdx 组件

- d3e52e4: chore(CI): update build config to improve vitest CI perf

  chore(CI): 更新构建配置来提升 vitest CI 性能

- 9fc3a6e: fix(doc-core): support link in header when using mdx-rs

  fix(doc-core): 当使用 mdx-rs 时支持在 header 中使用 link

- Updated dependencies [213089e]
- Updated dependencies [fb93353]
- Updated dependencies [362416f]
- Updated dependencies [9301e46]
- Updated dependencies [00b58a7]
- Updated dependencies [820bfe9]
- Updated dependencies [7d966a1]
  - @modern-js/builder-rspack-provider@2.28.0
  - @modern-js/builder@2.28.0
  - @modern-js/utils@2.28.0
  - @modern-js/doc-plugin-medium-zoom@2.28.0
  - @modern-js/remark-container@2.28.0
  - @modern-js/core@2.28.0

## 2.27.0

### Patch Changes

- 5dabe04: fix(doc-core): flatten error when meeting `# @modern-js/doc-core in mdx file

  fix(doc-core): 当出现 `# @modern-js/doc-core 字符时，mdx 内容扁平化结果异常

- 1895198: fix(doc-core): support hiding nav

  fix(doc-core): 支持隐藏导航栏

- 6af7fe0: fix(doc-core): search failed with base path

  fix(doc-core): base 路径存在时搜索失败

- 0221d29: fix(doc-core): delete empty `html` dir
- Updated dependencies [645e111]
- Updated dependencies [91d14b8]
- Updated dependencies [8322a51]
- Updated dependencies [5376a22]
- Updated dependencies [67d0b0c]
- Updated dependencies [3f79dd7]
- Updated dependencies [6d7104d]
  - @modern-js/builder-rspack-provider@2.27.0
  - @modern-js/utils@2.27.0
  - @modern-js/builder@2.27.0
  - @modern-js/core@2.27.0
  - @modern-js/doc-plugin-medium-zoom@2.27.0
  - @modern-js/remark-container@2.27.0

## 2.26.0

### Patch Changes

- 39f3c83: feat(doc-core): optimize error log while \_meta.json is not correct

  feat(doc-core): 当 \_meta.json 不正确时优化错误日志

- ce6d481: feat(doc-core): display aside bar in 14 inch MacBook by default

  feat(doc-core): 在 14 英寸 MacBook 上默认展示 aside 栏

- b2cf922: fix(doc-core): search result highlight not accurate

  fix(doc-core): 搜索结果高亮不准确

- 757485e: fix: can not find path only in windows bacause of the escape char
  fix: 在 windows 系统下因为转义字符而无法找到路径
- a0a207d: feat(doc-core): support no config usage in auto sidebar

  feat(doc-core): 支持自动侧边栏的无配置模式

- ee5a6f3: fix(doc-core): fallback to csr when ssr bundle load failed

  fix(doc-core): ssr bundle 加载失败时兜底为 CSR 渲染

- 6387971: fix(doc-core): fix codeblock background style in dark mode

  fix(doc-core): 修复代码块在暗色模式下的背景样式问题

- Updated dependencies [150ddb1]
- Updated dependencies [b36ece4]
- Updated dependencies [e26b05e]
- Updated dependencies [fac4ee0]
- Updated dependencies [786c195]
- Updated dependencies [cdf5b6b]
  - @modern-js/builder-rspack-provider@2.26.0
  - @modern-js/builder@2.26.0
  - @modern-js/core@2.26.0
  - @modern-js/doc-plugin-medium-zoom@2.26.0
  - @modern-js/remark-container@2.26.0
  - @modern-js/utils@2.26.0

## 2.25.2

### Patch Changes

- 0b3bba7: feat(doc-core): support for custom search runtime interception logic

  feat(doc-core): 支持自定义搜索运行时拦截逻辑

- 2c82d4a: feat(doc-core): optimize runtime temp file structure

  feat(doc-core): 优化运行时临时文件结构

- a44aac7: fix(doc-core): support conventional route for tsx file

  fix(doc-core): 支持 tsx 文件的约定式路由

- 3973a72: feat(doc-core): support module doc search

  feat(doc-plugin-api-docgen): 支持模块文档的搜索

- 0499ff8: fix(doc-core): throw error when ssr failed

  fix(doc-core): ssr 失败时抛出错误

- 272646c: feat(builder): bump webpack v5.88, support top level await

  feat(builder): 升级 webpack v5.88, 支持 top level await

- a44aac7: feat(doc-core): support preview for pages added in `addPages` hook

  feat(doc-core): 支持为 `addPages` 钩子新增的页面添加预览功能

- 5e2908c: fix(doc-core): ssg fallback

  fix(doc-core): ssg 阶段报错时的兜底处理

- Updated dependencies [63d8247]
- Updated dependencies [f54bb68]
- Updated dependencies [6651684]
- Updated dependencies [15a8276]
- Updated dependencies [272646c]
- Updated dependencies [358ed24]
  - @modern-js/utils@2.25.2
  - @modern-js/builder-rspack-provider@2.25.2
  - @modern-js/doc-plugin-medium-zoom@2.25.2
  - @modern-js/remark-container@2.25.2
  - @modern-js/builder@2.25.2
  - @modern-js/core@2.25.2

## 2.25.1

### Patch Changes

- Updated dependencies [b10045f]
- Updated dependencies [9f78d0c]
  - @modern-js/builder@2.25.1
  - @modern-js/utils@2.25.1
  - @modern-js/builder-rspack-provider@2.25.1
  - @modern-js/core@2.25.1
  - @modern-js/doc-plugin-medium-zoom@2.25.1
  - @modern-js/remark-container@2.25.1

## 2.25.0

### Minor Changes

- c179cbd: feat: support markdown global components
  feat: 支持在 markdown 作用域下注册全局组件

### Patch Changes

- 9ca6671: fix(module-doc): api table render error

  fix(module-doc): 修复模块文档 api table 渲染错误

- 4d47773: fix(doc-core): normalize windows path in loader

  fix(doc-core): 在 loader 中规范化 windows 路径

- b4d2fa2: fix(doc-core): \_meta.json hmr not work
- cd1bd19: fix(doc-core): .md comment compile error

  fix(doc-core): .md 文件中的注释导致编译报错

- ec716ea: fix(doc-core): encode filename to be compatible with Windows

  fix(doc-core): encode filename 以修复 Windows 兼容问题

- b4b0f9f: fix(doc-core): mock ssr window

  fix(doc-core): ssr 阶段 mock window

- 7f8c12b: fix(doc-core): checkDeadLink failed in windows

  fix(doc-core): 死链检测在 windows 下失败

- Updated dependencies [af97415]
- Updated dependencies [bafd4aa]
- Updated dependencies [5732c6a]
- Updated dependencies [d287b7f]
  - @modern-js/core@2.25.0
  - @modern-js/builder-rspack-provider@2.25.0
  - @modern-js/utils@2.25.0
  - @modern-js/doc-plugin-medium-zoom@2.25.0
  - @modern-js/remark-container@2.25.0
  - @modern-js/builder@2.25.0

## 2.24.0

### Patch Changes

- af9af0f: fix(doc-core): doc hmr invalid

  fix(doc-core): 文档热更新失效

- cdb88da: fix(doc-core): import with .js extension

  fix(doc-core): import 中携带 .js 后缀

- Updated dependencies [c882fbd]
- Updated dependencies [ef041c0]
- Updated dependencies [4fdd868]
- Updated dependencies [4a82c3b]
  - @modern-js/utils@2.24.0
  - @modern-js/builder-rspack-provider@2.24.0
  - @modern-js/builder@2.24.0
  - @modern-js/core@2.24.0
  - @modern-js/doc-plugin-medium-zoom@2.24.0
  - @modern-js/remark-container@2.24.0

## 2.23.1

### Patch Changes

- 496ec52: fix(module-doc): api params break

  fix(module-doc): api 参数错误

- Updated dependencies [20c85bb]
- Updated dependencies [f08bbfc]
- Updated dependencies [a6b313a]
- Updated dependencies [5772927]
- Updated dependencies [4af25d9]
- Updated dependencies [4d4dca0]
- Updated dependencies [8f2cab0]
  - @modern-js/builder-rspack-provider@2.23.1
  - @modern-js/builder@2.23.1
  - @modern-js/utils@2.23.1
  - @modern-js/core@2.23.1
  - @modern-js/doc-plugin-medium-zoom@2.23.1
  - @modern-js/remark-container@2.23.1

## 2.23.0

### Patch Changes

- 5d6652c: fix(doc-core): add withBase in addSSGRoutes

  fix(doc-core): 在 addSSGRoutes 中添加 withBase

- 090c9c3: chore(doc-core): add footer in frontmatter

  chore(doc-core): frontmatter 中增加 footer

- 074978b: fix(doc-core): toc replace multiply

  fix(doc-core): toc 内容被替换多次

- 7e6fb5f: chore: publishConfig add provenance config

  chore: publishConfig 增加 provenance 配置

- 12a5bb2: fix(doc-core): lark icon type

  fix(doc-core): lark 图标类型缺失

- 836da92: fix(doc-core): logo not show in production

  fix(doc-core): logo 在生产环境下不显示

- 5eba3a9: fix(doc-core): hydration error

  fix(doc-core): hydration 错误

- ad75a6e: fix(doc-core): hydrate error

  fix(doc-core): hydrate 阶段报错

- Updated dependencies [15eac36]
- Updated dependencies [a912b66]
- Updated dependencies [9b270b6]
- Updated dependencies [d4e85c1]
- Updated dependencies [7e6fb5f]
- Updated dependencies [a7a7ad7]
- Updated dependencies [f212633]
- Updated dependencies [b593040]
- Updated dependencies [5684381]
- Updated dependencies [6dec7c2]
- Updated dependencies [c3216b5]
- Updated dependencies [f14f920]
- Updated dependencies [692cc0e]
- Updated dependencies [38eccef]
- Updated dependencies [f91c557]
- Updated dependencies [a82d6f7]
  - @modern-js/builder-rspack-provider@2.23.0
  - @modern-js/builder@2.23.0
  - @modern-js/doc-plugin-medium-zoom@2.23.0
  - @modern-js/remark-container@2.23.0
  - @modern-js/utils@2.23.0
  - @modern-js/core@2.23.0

## 2.22.1

### Patch Changes

- a9009ee: fix(doc-core): suspense error in react 17 ssr

  fix(doc-core): react 17 版本服务端渲染 suspense 错误

- af75f6d: fix(doc-core): img compile error in table tag

  fix(doc-core): table 标签中的图片编译错误

- 9f732e0: fix(doc-core): dead link

  fix(doc-core): 死链问题

- 9093c4e: fix(doc-core): remove dark class when darkMode is false

  fix(doc-core): 当 darkMode 为 false 时，移除 dark 类

- 903de0f: fix(doc-core): polyfills are not injected

  fix(doc-core): 修复 polyfills 未注入的问题

- c290b9c: fix(doc-core): suspense runtime error

  fix(doc-core): 异步组件运行时错误

- 1f02cd2: chore: fix some eslint issues

  chore: 修复一些 eslint issues

- 0a5e2ef: fix(doc-core): sidebar title not correct sometimes

  fix(doc-core): 侧边栏标题有时不正确

- Updated dependencies [e2848a2]
- Updated dependencies [a470c04]
- Updated dependencies [bd4b150]
- Updated dependencies [c739207]
- Updated dependencies [c465db6]
- Updated dependencies [d4045ed]
- Updated dependencies [8bd9981]
- Updated dependencies [1f02cd2]
  - @modern-js/utils@2.22.1
  - @modern-js/builder-rspack-provider@2.22.1
  - @modern-js/builder@2.22.1
  - @modern-js/core@2.22.1
  - @modern-js/doc-plugin-medium-zoom@2.22.1
  - @modern-js/remark-container@2.22.1

## 2.22.0

### Minor Changes

- e465c68: feat: support blank page type and adjust doc layout
  feat: 支持 blank 页面并调整整体布局

### Patch Changes

- 3d48836: chore(deps): fix all missing peer dependencies

  chore(deps): 修复缺少的 peer dependencies

- 80d7bba: fix(doc-core): custom page written into the same file

  fix(doc-core): 自定义页面写入到同一个文件

- 7b25598: fix(doc-core): theme config normalize error

  fix(doc-core): 主题配置规范化错误

- 562ba82: fix(doc-core): avoid panic when mdx-rs parse error

  fix(doc-core): mdx-rs 出现编译错误避免 panic

- 68333c8: fix(doc-core): demo preview ssg

  fix(doc-core): demo 预览 SSG 失败的问题

- 60fddc8: feat(doc-core): support auto nav and sidebar

  feat(doc-core): 支持自动生成导航和侧边栏

- b371c97: fix(doc-core): build error when doc path includes "."

  fix(doc-core): 当文档路径包含 "." 时，构建失败

- 271f2c1: fix(doc-plugin-preview): preview plugin build error

  fix(doc-plugin-preview): 预览插件构建错误

- Updated dependencies [3d48836]
- Updated dependencies [4161b09]
- Updated dependencies [9c3c231]
- Updated dependencies [5050e8e]
- Updated dependencies [850cde6]
- Updated dependencies [ae3fcc2]
- Updated dependencies [27618e4]
- Updated dependencies [becfd36]
- Updated dependencies [02238e6]
  - @modern-js/builder-rspack-provider@2.22.0
  - @modern-js/utils@2.22.0
  - @modern-js/builder@2.22.0
  - @modern-js/core@2.22.0
  - @modern-js/doc-plugin-medium-zoom@2.22.0
  - @modern-js/remark-container@2.22.0

## 2.21.1

### Patch Changes

- 9503a5e: fix(doc-core): mdx flatten path resolve

  fix(doc-core): mdx 文件扁平化过程中路径解析错误

  - @modern-js/builder@2.21.1
  - @modern-js/builder-rspack-provider@2.21.1
  - @modern-js/core@2.21.1
  - @modern-js/doc-plugin-medium-zoom@2.21.1
  - @modern-js/remark-container@2.21.1
  - @modern-js/utils@2.21.1

## 2.21.0

### Patch Changes

- fdb0406: feat(doc-core): add routes for addPages hook

  feat(doc-core): 在 addPages 钩子中增加路由入参

- 26dcf3a: chore: bump typescript to v5 in devDependencies

  chore: 升级 devDependencies 中的 typescript 版本到 v5

- 0dd531a: fix(doc-core): sidebar link i18n

  fix(doc-core): 修复侧边栏链接国际化问题

- 0a6b969: feat(doc-core): support space in code title

  feat(doc-core): 代码块标题支持空格

- 8007951: feat: add doc medium-zoom plugin

  feat: 增加 medium-zoom 插件

- Updated dependencies [7d2972e]
- Updated dependencies [4cbe958]
- Updated dependencies [df43559]
- Updated dependencies [7d2972e]
- Updated dependencies [863f8df]
- Updated dependencies [55d37e9]
- Updated dependencies [e81eeaf]
- Updated dependencies [26dcf3a]
- Updated dependencies [8a7d4d2]
- Updated dependencies [441a579]
- Updated dependencies [056627f]
- Updated dependencies [0a86b31]
- Updated dependencies [4274510]
- Updated dependencies [c90ea5a]
- Updated dependencies [0fc15ca]
- Updated dependencies [43b4e83]
- Updated dependencies [ad78387]
  - @modern-js/builder-rspack-provider@2.21.0
  - @modern-js/doc-plugin-medium-zoom@2.21.0
  - @modern-js/core@2.21.0
  - @modern-js/builder@2.21.0
  - @modern-js/utils@2.21.0
  - @modern-js/remark-container@2.21.0

## 2.20.0

### Patch Changes

- 09c7af6: fix(doc-core): external link normalize

  fix(doc-core): 修复外部链接不规范的问题

- 0ce52ad: docs(main): optimize mobile adaptation

  docs(main): 优化移动端适配

- d714326: fix(doc-core): link error when base url exsits

  fix(doc-core): 修复存在 base url 时链接错误的问题

- 6b9d90a: chore: remove @babel/runtime. add @swc/helper and enable `externalHelper` config.
  chore: 移除 @babel/runtime 依赖. 增加 @swc/helpers 依赖并且开启 `externalHelpers` 配置
- Updated dependencies [3c4e0a5]
- Updated dependencies [f0ef868]
- Updated dependencies [6b9d90a]
- Updated dependencies [4b03d17]
- Updated dependencies [6289d31]
  - @modern-js/utils@2.20.0
  - @modern-js/builder-rspack-provider@2.20.0
  - @modern-js/builder@2.20.0
  - @modern-js/core@2.20.0
  - @modern-js/remark-container@2.20.0

## 2.19.1

### Patch Changes

- Updated dependencies [afb735f]
  - @modern-js/builder@2.19.1
  - @modern-js/builder-rspack-provider@2.19.1
  - @modern-js/core@2.19.1
  - @modern-js/remark-container@2.19.1
  - @modern-js/utils@2.19.1

## 2.19.0

### Patch Changes

- 7c234b5: fix(doc-core): make sidebar font-weight consistent

  fix(doc-core): 使 sidebar 的 font-weight 保持一致

- 9fe6499: feat(doc-core): reduce 80% time of ssg

  feat(doc-core): 减少 80% 的 ssg 时间

- c8ba482: fix(doc-core): props.children error in code component

  fix(doc-core): 修复 code 组件中 props.children 不存在的错误

- Updated dependencies [1134fe2]
  - @modern-js/utils@2.19.0
  - @modern-js/core@2.19.0
  - @modern-js/builder@2.19.0
  - @modern-js/builder-rspack-provider@2.19.0
  - @modern-js/remark-container@2.19.0

## 2.18.1

### Patch Changes

- 3f35bdc: feat(doc-core): add time logs for page rendering

  feat(doc-core): 增加页面渲染的耗时日志

- 5c56edd: feat(doc-core): support react 17

  feat(doc-core): 支持 react 17

- a784fcd: feat(doc-core): use prism for code highlight

  feat(doc-core): 代码高亮使用 prism

- Updated dependencies [9b0b7ef]
- Updated dependencies [abf8c6d]
- Updated dependencies [a6ac01a]
- Updated dependencies [010b67e]
- Updated dependencies [160a0b3]
  - @modern-js/builder-rspack-provider@2.18.1
  - @modern-js/builder@2.18.1
  - @modern-js/remark-container@2.18.1
  - @modern-js/core@2.18.1
  - @modern-js/utils@2.18.1

## 2.18.0

### Patch Changes

- 2034e01: feat(doc-core): doc support nav postion

  feat(doc-core): doc 支持顶部菜单独立配置定位

- 77932c1: fix(doc-core): none nav bar

  fix(doc-core): 导航栏消失

- Updated dependencies [ea60b58]
- Updated dependencies [7de6599]
  - @modern-js/builder-rspack-provider@2.18.0
  - @modern-js/remark-container@2.18.0
  - @modern-js/builder@2.18.0
  - @modern-js/core@2.18.0
  - @modern-js/utils@2.18.0

## 2.17.1

### Patch Changes

- 846590d: feat: add new modern.js doc support edit this page on github (#3527)

  feat: 添加新的 modern.js 文档支持在 Github 上编辑此页面 (#3527)。

- e3733a3: feat(doc-core): doc plugin system doc optimization

  feat(doc-core): 文档框架插件机制文档优化

- ecdcd71: fix(doc-tools): edit link should open a new tab

  fix(doc-tools): edit link 应该打开一个新窗口

- 01b4e32: fix(doc-core): sidebar title not correct in dev

  fix(doc-core): 开发环境下，侧边栏标题不正确

- 01b4e32: fix(doc-core): avoid ssg marker transform

  fix(doc-core): 避免某些特殊字符转换为 marker 字符

- 06dd14e: fix(doc-core): Nav top menu style issue (#3598)

  fix(doc-core): Nav 顶部菜单样式问题 (#3598)

- 8b7f7f2: fix(doc-core): The 960px-1440px and 1440px center container widths do not include the width of the scroll bar to avoid horizontal scroll bars
  fix(doc-core): 960px-1440px 和 1440px 版心容器宽度不包含滚动条宽度，避免出现横向滚动条
- cb3cc7f: fix(doc-core): alias react-dom

  fix(doc-core): 内置 react-dom 别名

- e3733a3: fix: code line highlight in js compiler

  fix: js 版本编译器中代码行高亮问题

  - @modern-js/builder@2.17.1
  - @modern-js/builder-rspack-provider@2.17.1
  - @modern-js/core@2.17.1
  - @modern-js/remark-container@2.17.1
  - @modern-js/utils@2.17.1

## 2.17.0

### Minor Changes

- 85fb207: feat(doc-core): auto i18n

  feat(doc-core): 自动化 i18n

### Patch Changes

- cb52e34: fix: code line highlight in js compiler

  fix: js 版本编译器中代码行高亮问题

  - @modern-js/builder@2.17.0
  - @modern-js/builder-rspack-provider@2.17.0
  - @modern-js/core@2.17.0
  - @modern-js/remark-container@2.17.0
  - @modern-js/utils@2.17.0

## 2.16.0

### Patch Changes

- f15fe5a: fix(doc-core): add useEffect dependencyList for docLayout and use padding in content
  fix(doc-core): 给 docLayout 组件添加 useEffect 的依赖项并给 doc content 加上 padding
- cd0bc21: feat: local sidebar closed when router changed

  feat: 路由变化时关闭本地侧边栏

- 5cd8527: fix: toc hmr not work

  fix: toc 热更新不生效

- 628be4b: fix: home page hmr & e2e build test

  fix: 首页热更新问题 & doc tools e2e 生产环境构建测试

- ddc066d: fix: nest relative ../ path not work in mdx-rs

  fix: mdx-rs 中嵌套相对路径 ../ 不生效

- 4e876ab: chore: package.json include the monorepo-relative directory

  chore: 在 package.json 中声明 monorepo 的子路径

- 9eec77b: fix: sidebar not exist when meeting chinese path

  fix: 侧边栏在遇到中文路径时不存在

- 6b905d5: fix(doc-core): failed to resolve useLocation method in some cases

  fix(doc-core): 修复个别情况下找不到 useLocation 方法的问题

- b16de50: fix: support chinese route

  fix: 支持中文路由

- a824aad: fix: set defaultHasAside false if in iframe
  fix: 被 iframe 引入时默认不展示 aside
- 6f3548a: fix: set sidebar and aside max-height not height
  fix: 设置 sidebar 和 aside 的最大高度而不是高度属性
- Updated dependencies [5954330]
- Updated dependencies [50bc0db]
- Updated dependencies [fd4a8a6]
- Updated dependencies [7596520]
- Updated dependencies [4e876ab]
- Updated dependencies [6d5219e]
- Updated dependencies [fb19f48]
  - @modern-js/utils@2.16.0
  - @modern-js/builder-rspack-provider@2.16.0
  - @modern-js/builder@2.16.0
  - @modern-js/core@2.16.0
  - @modern-js/remark-container@2.16.0

## 2.15.0

### Patch Changes

- 81bf045: feat(doc-core): support addPages

  feat(doc-core): 支持 addPages 插件钩子

- Updated dependencies [7d23d39]
- Updated dependencies [3e5e790]
  - @modern-js/builder-rspack-provider@2.15.0
  - @modern-js/builder@2.15.0
  - @modern-js/core@2.15.0
  - @modern-js/remark-container@2.15.0
  - @modern-js/utils@2.15.0

## 2.14.0

### Minor Changes

- 16399fd: feat: support extendPageData hook and last updated time

  feat: 支持 extendPageData 钩子和最后更新时间功能

### Patch Changes

- d27fae0: feat: add doc-tools e2e

  feat: 添加 doc-tools e2e 测试用例

- 7b002f4: fix: doc e2e test in windows

  fix: 解决 windows 下 e2e 测试失败的问题

- 7423070: fix: change content padding-bottom from 48px to 72px, equal to header height
  fix: 将内容区域的底部内边距从 48px 修改为 72px，和头部高度保持一致
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
