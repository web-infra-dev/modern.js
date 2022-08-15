---
sidebar_position: 2
---

# Hook 模型

首先介绍一下 Modern.js 的基础的插件系统中的一些内容，包括 Hook 模型的工作方式、各个 Hook 模型的运行模式、Manager 的工作模式。

每种 Hook 模型都是独立的，可以独立管理运行函数。

## 基础工作方式

先以 Pipeline 为例，简单介绍一下 Hook 模型的工作方式。先看一个简单的例子：

```ts
import { createPipeline } from '@modern-js/plugin'

// 1. 创建
const pipeline = createPipeline<number, number>()

// 2. 添加函数
pipeline.use((count, next) => {
  return next(count + 1)
})
pipeline.use((count, next) => {
  return count * 2
})

// 3. 执行
pipeline.run(1) // 4
pipeline.run(5) // 12
```

在这个例子中，创建了一个 `Pipeline<number, number>` 类型的 Pipeline（L3），这意味着运行它的时候，你需要传入一个 `number`，然后你会得到一个 `number`，而这个模型管理的函数的类型是：

```ts
(count: number, next: (nextCount: number) => number) => number
```

这里全是 `number`，是因为我们创建的是 `Pipeline<number, number>` ，如果创建的是 `Pipeline<number, string>` 则运行它入参是 `number`，返回值是 `string`，对应管理的函数的类型会是：

```ts
(count: number, next: (nextCount: number) => string) => string
```


创建好 Pipeline 之后，可以通过 `use` 添加函数（L5、L8），需要注意的是，添加的顺序就是他们默认的运行顺序，在这些函数中，你可以对 `count` 进行处理、返回一个值，如果你调用了 `next` 函数，则会运行后面的函数，即如果你添加了三个函数： `A`、`B`、`C`，如果你在 `A` 中调用 `next` 那么就会运行 `B`，同样的，如果你在 `B` 中调用 `next` 那么就会运行 `C`，而在上面的例子中，添加的第一个函数（L5）就运行了 `next`，所以这里就会运行第二个函数（L8），并且运行的返回值就是 第二个函数的返回值，如果在第一个函数中没有调用 `next`，直接返回，例如：

```ts
import { createPipeline } from '@modern-js/plugin'

// 1. 创建
const pipeline = createPipeline<number, number>()

// 2. 添加函数
pipeline.use((count, next) => {
  return count + 1
})
pipeline.use((count, next) => {
  return count * 2
})

// 3. 执行
pipeline.run(1) // 2
pipeline.run(5) // 6
```

则在运行 Pipeline 的时候就不会运行第二个函数，那么 Pipeline 的运行结果则就是第一个函数的返回值。

最后，运行 Pipeline 的方式也显而易见就是调用 `pipeline.run` 。

## 不同 Hook 模型的区别

上面这部分就是 Pipeline 整体的一个工作模式的描述，其他的 Hook 模型的工作模式基本也是这样，主要的区别点，是函数类型、执行顺序，参数。

### Pipeline

上面的例子就是以 Pipeline 为例描述的，这里就不赘述了，在 Pipeline 这个大类中，提供了两个小类：Sync 和 Async，顾名思义，它们的区别就是管理的函数的类型是 Sync 的还是 Async 的。

:::info 注
当 Pipeline 中没有函数或者所有函数都调用了 `next` 函数，则就需要在运行的时候提供：

```ts
pipeline({}, {
    onLast: () => {
        // do something
    }
})
```
:::

### Waterfall

这种模型顾名思义，他的特点就是参数的顺序递交，即前面一个函数的返回值，将会成为下一个函数的入参，我们也用一个例子来看一下：

```ts
import { createWaterfall } from '@modern-js/plugin'

// 1. 创建
const waterfall = createWaterfall<number>()

// 2. 添加函数
waterfall.use((count) => {
  return count + 1
})
waterfall.use((count) => {
  return count * 2
})

// 3. 执行
waterfall.run(1) // 4
waterfall.run(5) // 12
```

这个例子中，创建了一个类型为 `Waterfall<number> `，即这个模型执行的入参和返回值是一样的，这个例子中都是 `number`，而它管理的函数的类型是：

```ts
(count: number) => number
```

可能简单看这个例子感觉和上面的 Pipeline 功能一样，那需要注意的是，首先这里 Waterfall 管理的函数没有next 函数作为第二个参数，所以它无法在函数内部通过调用 next 来先运行之后添加的函数，从而修改运行的顺序，其次这里的运行的入参的类型和返回值的类型必须是一样的（而 Pipeline 可以不一样）。

同样的，在 Waterfall 这个大类中，也提供了 Sync 和 Async 的小类，分别对应 Sync 和 Async 的函数。

### Workflow

这种 Hook 模型与上面两种 Hook 模型的区别是，没有那么强的前后参数返回值递交的概念，在这个模型中，每个函数都是基于同样的入参，相对独立运行的，通过一个例子简单看一下：

```ts
import { createWorkflow } from '@modern-js/plugin'

// 1. 创建
const workflow = createWorkflow <number, number>()

// 2. 添加函数
workflow.use((count) => {
  return count + 1
})
workflow.use((count) => {
  return count * 2
})

// 3. 执行
workflow.run(1) // [2, 2]
workflow.run(5) // [6, 10]
```

在这个例子中，添加了两个函数，所以运行的结果就是这两个函数运行的结果形成的一个数组。

虽然这种模型中没有那么强的前后参数返回值递交的概念，但依旧有执行顺序的区别，在 Workflow 这个大类中，提供了三个小类：Sync、Async、Parallel。他们之间的区别就是函数的执行顺序，当然默认的都是按照添加顺序执行，而在 Sync、Async 则是强制按照添加顺序执行，而 Parallel 则是 Async 模式的一个变体，即它使用的是 `Promise.all` 来执行所有函数，而 Async 则会 `await` 前面的函数运行结束。

## Hook 模型对比

<div style={{ width: "100%", overflowX: "scroll" }}>
<div style={{ width: "150%" }}>

||函数类型|执行顺序|函数参数来源|执行返回值来源|倾向处理的任务类型|函数 TS 类型|
|-----|-----|-----|-----|----|----|----|
|Pipeline|Sync|默认执行第一个添加的函数，可以通过 next 调用之后添加的函数|第一个函数的参数来源是运行的参数，之后的函数的参数来源是，前一个函数向 next 函数传递的参数|第一个函数的返回值|<ul><li>需要修改初始参数</li><li>需要修改函数执行顺序</li></ul>|`(input: I, next: Next<I, O>) => O`|
|AsyncPipeline|Sync/Async|默认执行第一个添加的函数，可以通过 next 调用之后添加的函数|第一个函数的参数来源是运行的参数，之后的函数的参数来源是，前一个函数向 next 函数传递的参数|第一个函数的返回值|<ul><li>需要修改初始参数</li><li>需要修改函数执行顺序</li></ul>|`(input: I, next: AsyncNext<I, O>) => O ｜ Promise<O>`|
|WaterFall|Sync|一直顺序执行|第一个函数的参数来源是运行的参数，之后的函数的参数来源是，前一个函数的返回值|最后一个函数的返回值|<ul><li>需要修改初始参数</li><li>不需要修改函数执行顺序</li></ul>|`(I: I) => I`|
|AsyncWaterFall|Sync/Async|一直顺序执行|第一个函数的参数来源是运行的参数，之后的函数的参数来源是，前一个函数的返回值|最后一个函数的返回值|<ul><li>需要修改初始参数</li><li>不需要修改函数执行顺序</li></ul>|`(I: I) => I ｜ Promise<I>`|
|Workflow|Sync|一直顺序执行|所有函数的入参都是运行的参数|所有函数返回值形成的数组|<ul><li>不需要修改初始参数</li><li>不需要修改函数执行顺序</li></ul>|`(I: I) => O`|
|AsyncWorkflow|Sync/Async|一直顺序执行|所有函数的入参都是运行的参数|所有函数返回值形成的数组|<ul><li>不需要修改初始参数</li><li>不需要修改函数执行顺序</li></ul>|`(I: I) => O ｜ Promise<O>`|
|ParallelWorkFlow|Sync/Async|异步执行|所有函数的入参都是运行的参数|所有函数返回值形成的数组|<ul><li>不需要修改初始参数</li><li>不关心执行顺序</li></ul>|`(I: I) => O ｜ Promise<O>`|

</div>
</div>

Workflow、Waterfall 其实都是 Pipeline 的变体，Pipeline 可以通过特定的写法来实现 Workflow、Waterfall ，但都较为麻烦，有许多隐形的约定，为了方便使用，提供了这两种变体来满足这种特殊场景。
