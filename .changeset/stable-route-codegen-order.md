---
'@modern-js/runtime': patch
---

fix(runtime): keep generated route component bindings in a stable order

The route code generator read each component's `use client` directive while walking the route tree, so sibling branches appended to the shared `errors` / `loadings` / `loaders` arrays in file-read completion order. The same sources could emit `error_0` for a different file on every build, changing import order, chunk contents and output hashes. The directives are now resolved before the walk.

fix(runtime): 路由代码生成的组件绑定顺序不再随机

路由代码生成器在遍历路由树的过程中读取组件的 `use client` 指令，兄弟分支按各自文件读取完成的先后追加到共享的 `errors` / `loadings` / `loaders` 数组，因此同一份源码每次构建生成的 `error_0` 可能指向不同文件，进而改变 import 顺序、chunk 内容与产物 hash。现在改为在遍历前解析这些指令。
