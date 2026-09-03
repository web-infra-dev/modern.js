# SSR ESM cache invalidation 设计复盘笔记

## 背景

Issue #8373 的现象是：

- dev + SSR + ESM 模式下
- 修改页面文件后刷新浏览器
- 服务端渲染结果还是旧内容
- 客户端拿到新内容
- 最终触发 hydration mismatch

这个问题看上去像“ESM 缓存没有失效”，但真正麻烦的地方不是顶层入口 bundle，而是入口 bundle 继续加载的子 chunk。

## 一句话结论

这次修复不是去改 rspack 本身，也不是直接改正式产物文件，而是：

- 读取 SSR bundle
- 在运行时把 rspack 产物里的 nested chunk dynamic import 改写成带时间戳的形式
- 写一份临时 patched bundle
- 用 Node 原生 `import()` 执行这份临时文件
- 执行结束后删除临时文件

核心目的是：不仅让入口 bundle 失效，还让它内部继续 import 的子 chunk 也一起失效。

---

## 修复前的执行链路

### 现象流程图

```text
你修改了 page.tsx
   |
   v
Modern dev 重新构建 SSR 入口 bundle
dist/bundles/index.js
   |
   v
Node 重新 import 入口 bundle
import("index.js?t=NEW")
   |
   v
入口 bundle 运行时继续加载子 chunk
import("./" + __webpack_require__.u(chunkId))
   |
   v
子 chunk URL 没变
例如 ./page.js
   |
   v
Node ESM cache 命中旧的 page.js
   |
   +--> 服务端 SSR 还是旧内容
   |
   +--> 客户端拿到新内容
   |
   v
Hydration mismatch
```

### 关键判断

真正的问题不是“入口 bundle 没重新加载”，而是：

```text
入口 bundle 重新加载了
但是它内部继续 import 的子 chunk 没有变成新 URL
因此子 chunk 仍然命中了旧的 ESM cache
```

也就是说，顶层 `?t=` 已经存在，但它只解决了入口模块失效，不解决 nested chunk 失效。

---

## 我最后采用的修复思路

### 运行时 patch 思路图

```text
read index.js
   |
   v
找到 rspack 产物里的这段代码
import("./" + __webpack_require__.u(chunkId))
   |
   v
改写成
import("./" + __webpack_require__.u(chunkId) + "?t=NEW")
   |
   v
把改写后的内容写到临时 .mjs 文件
   |
   v
Node import 这个临时文件
   |
   v
临时文件内部继续加载子 chunk 时
变成 ./page.js?t=NEW
   |
   v
Node 把它视为新模块
   |
   v
服务端 SSR 拿到新内容
   |
   v
不再 hydration mismatch
```

### 为什么要写临时文件

这是我当时做方案选择时一个非常重要的点。

Node 原生 `import()` 不是拿源码字符串执行的，它需要的是：

- 一个模块 URL
- 或者一个文件路径

我如果已经把 bundle 内容改写好了，但还想继续保留：

- Node 原生 ESM 语义
- 相对路径解析能力
- nested dynamic import 的正常行为

那么最短路径就是：

```text
改字符串 -> 落一个临时 .mjs -> 交给原生 import() 执行
```

所以这里“写文件”不是为了持久修改产物，而是为了让 Node 正常把这份 patched 源码当成 ESM 模块执行。

### 重要澄清

我没有直接篡改 rspack 的正式输出文件。

实际做的是：

- 读正式 bundle
- 在内存里 patch
- 写一个短生命周期的临时副本
- import 临时副本
- 再删除临时副本

这更接近“运行时执行补丁”，不是“改构建产物本体”。

---

## 为什么我没有最终采用 Node.js import hook 方案

我不是没考虑过 import hook。实际上，这个方向一开始就很自然，因为它看起来：

- 更优雅
- 不需要写临时文件
- 更贴近模块加载层

但最后我没有选它，是因为它在这次问题上最大的风险不是“写起来麻烦”，而是“很难证明它真的修到了正确的那一层”。

---

## import hook 路线最难的点到底在哪里

### 难点 1：真正的问题 import 不是普通源码 import，而是运行时拼出来的 import

普通情况下，hook 最好处理的是这种：

```js
import './foo.js'
```

但这次真正有问题的是 rspack runtime 产物里的：

```js
import("./" + __webpack_require__.u(chunkId))
```

这个 import 有两个特点：

- 不是静态字面量
- 路径是运行时根据 `chunkId` 算出来的

所以你要靠 hook 修它，真正的问题不是“能不能注册一个 hook”，而是：

```text
Node loader 在这一刻拿到的，到底是不是我想改写的那个最终 specifier？
```

如果这个前提不成立，hook 就可能只改到了顶层 import，没改到 nested chunk import。

### 难点 2：你必须证明 hook 改到的是 nested chunk，而不是只改到了入口 bundle

这次 bug 最容易误判的地方就在这里。

因为入口 bundle 本来就已经在 dev 模式下带时间戳了，所以如果你做了一个 hook，很容易出现：

```text
看起来 import 被改写了
但其实改写的只是顶层入口 import
真正有问题的 nested chunk import 没改到
```

如果发生这种情况，现象会非常迷惑：

- 日志看起来 hook 在工作
- 顶层 bundle 也确实重新加载了
- 但最终 bug 还是没修掉

所以 import hook 真正难的，不是让它“动起来”，而是确认它动到的是正确层级。

### 难点 3：作用范围很难拿捏，太宽会误伤，太窄会漏修

一旦你启用 hook，它天然就更接近全局机制。

这时你必须判断：

- 哪些 import 应该加 `?t=`
- 哪些不应该动

至少要分清：

- 本地 chunk
- node_modules
- `node:` 内建模块
- 其他非 SSR 的 dev import
- 不是 rspack runtime chunk 的普通 import

如果规则写成“所有本地模块都加时间戳”，很可能误伤。

如果规则写得过于保守，又很可能漏掉真正要修的 nested chunk import。

所以它最难的工程点之一是：

```text
如何把规则收敛到足够窄，但又不漏掉问题路径
```

### 难点 4：你必须依赖 parent context，而不是只看 specifier 本身

一个 `specifier` 单看经常不够。

比如：

```text
./page.js
```

它本身并不能告诉你：

- 这是普通模块导入
- 还是 SSR bundle 里的 nested chunk 导入
- 还是别的上下文产生的相对引用

因此 hook 真要做稳，通常必须结合：

- `specifier`
- `parentURL`
- 当前 parent 是否来自目标 SSR bundle
- 当前 import 是否处于 rspack runtime chunk loading 路径

这会让逻辑比看上去复杂很多。

### 难点 5：验证成本更高

临时 patched bundle 的好处是，验证非常直接。

我可以直接看到：

```text
原始 bundle 里是什么
-> 我改成了什么
-> import 的临时文件是什么
-> 最终 nested chunk URL 变成了什么
```

但 hook 方案更间接。

你通常需要更多 instrumentation 才能证明：

- hook 确实命中了目标 nested chunk import
- 改写后的路径确实参与了解析
- 真正载入的是新模块而不是旧缓存
- 没对无关 import 产生副作用

所以它的问题不是“理论上不优雅”，而是“验证链路更长，证据更难拿齐”。

---

## 两条路线的对比

### 对比表

| 方案 | 优点 | 缺点 | 我这次为什么没选/选了 |
|---|---|---|---|
| import hook | 架构上更优雅；不需要写临时文件；更接近 loader 层 | 作用范围更大；更难只修到目标路径；更难证明 nested chunk 一定被改写 | 没选，因为这次问题最怕“看起来生效，实际上没改到 nested chunk” |
| 临时 patched bundle | 非常定点；容易验证；测试可控；只影响当前 dev SSR ESM 路径 | 需要写临时文件；依赖当前 rspack 产物形态；不如 hook 优雅 | 选了，因为它更窄、更直接、更容易证明修到了问题核心 |

### 简化流程对比

#### import hook 路线

```text
Node import entry
   |
   v
entry 执行
   |
   v
rspack runtime 生成 nested chunk import
   |
   v
hook 是否真的拦到这里？
   |
   +-- 拦不到 -> 修复无效
   +-- 拦到了但规则过宽 -> 误伤其他 import
   +-- 拦到了且规则正确 -> 才算真正修稳
```

#### temporary patched bundle 路线

```text
直接改 entry bundle 里的 nested chunk import 源码
   |
   v
把目标 import 明确变成带 ?t= 的 URL
   |
   v
再交给 Node 原生 import 执行
```

---

## 为什么我认为这次选择是合理的

我当时的取舍不是“哪个方案更优雅”，而是：

```text
哪个方案更容易在当前问题上形成闭环证据
```

这里的闭环证据包括：

1. 能解释 root cause
2. 能精确改到 root cause
3. 能写测试覆盖它
4. 能验证修复前后差异

临时 patched bundle 方案虽然没那么漂亮，但在这四点上都更直接。

---

## 未来如果要重做 import hook 方案，我会重点盯什么

如果将来真的要把这套逻辑抽象成更“正统”的 loader/hook 方案，我认为最需要先解决的是这几个问题：

1. **确认 hook 是否稳定命中 nested chunk import**
   - 不是只命中 entry import
   - 需要有非常明确的 tracing

2. **确认改写范围足够窄**
   - 只在 dev SSR ESM 触发
   - 只影响目标 bundle 及其 nested chunk

3. **确认 parent context 可可靠识别**
   - 能判断当前 import 是否来自目标 SSR bundle
   - 不依赖脆弱假设

4. **补齐更强的验证手段**
   - 不只是看有没有 hydration error
   - 还要验证 SSR HTML 本身已经变成新内容
   - 最好还能验证 nested chunk URL 确实发生变化

---

## 最后一句总结

这次我没有选 import hook，不是因为它“不好”，而是因为：

```text
它更像一个更通用、更优雅的架构方案，
但对这个具体 bug 来说，
临时 patched bundle 是更窄、更可验证、更容易形成修复闭环的方案。
```

---

## 决策过程复盘（接近思维链的版本）

这一节不是逐字的内部推理记录，而是我在处理这个问题时真实采用的“假设 -> 证据 -> 调整方向”的决策过程复盘。

### 阶段 1：先确认问题是否还存在

最开始我没有默认 issue 描述一定还是当前代码里的真实问题，而是先把目标收敛成：

```text
先证明 bug 还存在，再讨论修法
```

所以第一步不是选方案，而是：

- 读 issue 内容
- 理解用户描述的触发路径
- 在当前分支上构造/运行复现测试

这一步的目标很明确：避免为一个已经变化或已经被别处修掉的问题设计方案。

### 阶段 2：先怀疑顶层 bundle 失效有问题

在还没看到真实产物之前，一个自然假设是：

```text
是不是顶层 SSR bundle 自己都没有重新加载？
```

因为从表面现象看，“服务端还是旧内容”很像入口模块没有失效。

所以我优先检查：

- 顶层 SSR bundle 的加载路径
- `compatibleRequire()` 在 dev + esm 条件下做了什么
- 入口 bundle 文件本身是否有变化

这一步的思考重点是：先抓离现象最近的一层，而不是一上来就怀疑复杂的运行时细节。

### 阶段 3：发现顶层 bundle 已经在变，于是转向下一层

当我确认顶层 bundle 其实已经在重新加载时，原来的假设就被推翻了。

这个时候我的问题变成：

```text
如果入口 bundle 已经重新加载，为什么 SSR 结果还是旧的？
```

这迫使我继续沿着执行链往里看，而不是继续在“入口是否失效”这个方向打转。

也就是从：

```text
是不是入口没更新？
```

切换成：

```text
入口更新后，内部是不是还有别的缓存层？
```

### 阶段 4：把问题重新定位为 nested chunk cache 没失效

继续读 rspack 产物以后，我看到了这种代码：

```js
import("./" + __webpack_require__.u(chunkId))
```

到这里，问题的结构才真正清晰起来。

我当时的判断发生了一个关键转折：

```text
不是“入口 bundle 没失效”
而是“入口 bundle 失效了，但它内部继续 import 的子 chunk 还是旧 URL”
```

一旦这样理解，很多现象就都能对上：

- 为什么入口加载逻辑看起来没问题
- 为什么服务端还是旧内容
- 为什么客户端却能拿到新内容
- 为什么最终是 hydration mismatch

### 阶段 5：开始比较候选方案，而不是只盯着一个“看起来优雅”的解法

到这里，我脑子里实际上有几条路线：

1. import hook / loader 路线
2. `requireFromString` / `_compile` 路线
3. 直接 patch bundle runtime import 的路线

这时我没有直接按“优雅程度”选，而是用更工程化的标准去筛：

- 它是不是直接命中 root cause？
- 它的影响范围能不能控制得很窄？
- 它能不能被测试清楚地证明？
- 如果失败，调试成本高不高？

这个阶段最重要的思考不是“哪个方案看起来更高级”，而是：

```text
哪个方案更容易形成闭环证据
```

### 阶段 6：为什么 import hook 最后没有赢

我当时对 import hook 的直觉评价其实是：

```text
更优雅，但不够短路径
```

它的问题不是理论上做不到，而是：

- 我需要证明它真的拦到了 nested chunk import
- 而不是只改到了顶层 import
- 同时还要证明不会误伤别的 import

这意味着它的验证链条更长。

对这次 bug 来说，我最不想要的是：

```text
代码看起来很漂亮
日志看起来也像在工作
但实际上根本没改到真正出问题的那层
```

所以我最终没有把修复赌在 hook 上。

### 阶段 7：为什么 temporary patched bundle 赢了

当我看到可以直接对 rspack 产物里的这段代码做精确改写时，判断开始明显偏向这个方案：

```text
先把 nested chunk import 变成我明确想要的样子
再把它交给 Node 原生 import 执行
```

这个路径的好处是：

- root cause 很直接
- patch 点很直接
- 观察点很直接
- 测试也很直接

虽然“写临时文件”看起来有点怪，但在当时的决策里，它属于：

```text
局部不够优雅，但整体更可控
```

我当时更看重“这次把 bug 修稳”，而不是“这次方案是不是最漂亮”。

### 阶段 8：实现后继续收紧，而不是停在“能跑通”

修复能工作以后，我没有把它当成结束，而是继续问两个问题：

1. 这个实现有没有明显风险点？
2. 测试是不是足够证明它修到了原问题？

这就引出了后续的两个修正：

- 临时文件命名冲突风险 -> 改成 `pid + counter + randomUUID`
- 集成测试最初只看 error，不够强 -> 加上刷新后 HTML 内容断言

也就是说，决策过程不是：

```text
想到一个方案 -> 写完 -> 结束
```

而是：

```text
先找 root cause
-> 选最短证据链的方案
-> 实现后继续用 review 和测试把证据补齐
```

---

## 用更短的话概括我的决策过程

如果要把整个思考过程压缩成最核心的几句，它大概是这样的：

```text
先证明 bug 还在
-> 先怀疑入口 bundle
-> 发现入口其实已经失效
-> 顺着执行链发现 nested chunk 仍然命中旧缓存
-> 比较几条修法时，优先选“最容易闭环验证”的方案
-> 因此最终选择 temporary patched bundle，而不是把修复押在更全局的 import hook 上
```
