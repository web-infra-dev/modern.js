---
sidebar_position: 4
---

# 上下文共享机制

[上一节](./manager) 提到的功能中，对数据的传递只有 Hook 模型中函数之间的参数传递，有着诸多限制，很多时候不能满足我们传递参数的需求，这里提供了一种基于上下文的参数传递/共享机制。

同样，先通过一个例子了解一下：

```ts {12,17,24,32,40}
import { createManager, createPipeline, createContext } from '@modern-js/plugin'

// 1. 创建 Hook 模型
const foo = createPipeline<void, void>()

const manager = createManager({ foo })

const countContext = createContext(0)
const useCounter = () => countContext.use().value

const plugin = manager.createPlugin(() => {
    console.log(useCounter()) // 1
    countContext.set(2)

    return {
        foo: () => {
            console.log(useCounter()) // 3
            countContext.set(4)
        }
    }
})

manager.run(() => {
    console.log(useCounter()) // 0
    countContext.set(1)
})

const runner = manager.init()


manager.run(() => {
    console.log(useCounter()) // 2
    countContext.set(3)
})

runner.foo()


manager.run(() => {
    console.log(useCounter()) // 4
})

// console
// 0
// 1
// 2
// 3
// 4
```

上面的例子中，先创建了一个 Context（L8），然后依次在这些地方执行

1. `manager.run`（L23）
2. 插件初始化函数（L12）
3. `manager.run`（L31）
4. `foo` 插件函数（L17）
5. `manager.run`（L39）

通过打印出来的信息可以看到，在这些地方都可以拿到 Context 中上一次设置的值，但如果是在不同的 Manager 中，则不会拿到另一个 Manger 中设置的值，例如：

```ts {13,18,23,28,33,38}
import { createManager, createPipeline, createContext } from '@modern-js/plugin'

// 1. 创建 Hook 模型
const foo = createPipeline<void, void>()

const manager1 = createManager({ foo })
const manager2 = createManager({ foo })

const countContext = createContext(0)
const useCounter = () => countContext.use().value

manager1.run(() => {
    console.log(useCounter()) // 0
    countContext.set(1)
})

manager2.run(() => {
    console.log(useCounter()) // 0
    countContext.set(11)
})

manager1.run(() => {
    console.log(useCounter()) // 1
    countContext.set(2)
})

manager2.run(() => {
    console.log(useCounter()) // 11
    countContext.set(12)
})

manager1.run(() => {
    console.log(useCounter()) // 2
})


manager2.run(() => {
    console.log(useCounter()) // 12
})

// console
// 0
// 0
// 1
// 11
// 2
// 12
```

所以这里实现了 Context 数据的隔离，可以实现在同一个 Manager 中安全的传递数据。


:::note 注

Modern.js 插件系统中的 **上下文共享机制** 是基于 Node.js 的 **Async Hook** 特性实现。

* 这个功能是可选的，没有默认开启，需要手动开启。

* Async Hook 的开启和关闭只和上下文共享机制有关，如果需要在异步场景下使用上下文共享机制，则需要开启。开启/关闭方法：

  ```ts
  import { enable, disable } from '@modern-js/plugin/node'

  enable() // 开启
  disable() // 关闭
  ```

* 当然只能在 Node.js 环境下开启，开启之后 Node.js 性能会变差，Promise 运行所需时间是原来的两到三倍，具体可看 [bmeurer/async-hooks-performance-impact](https://github.com/bmeurer/async-hooks-performance-impact)。
:::
