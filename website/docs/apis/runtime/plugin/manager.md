---
sidebar_position: 3
---

# Manager

有了 Hook 模型之后，我们就可以通过 Manager 来组织和管理它们，形成插件的模型。在 Manager 中，我们并不关心他们具体是哪些 Hook 模型，只是负责整合它们，收集插件，将插件中对应的函数添加到对应的 Hook 模型中，然后将所有 Hook 模型的运行函数收集整合起来，形成一个 Runner 对象。

## 基础

先通过一个例子整体了解一下：

```ts
import {
    createManager,
    createPipeline,
    createWaterfall,
    createWorkflow
} from '@modern-js/plugin'

// 1. 创建 Hook 模型
const foo = createPipeline<number, number>()
const bar = createWaterfall<number>()
const baz = createWorkflow<number, number>()

// 2. 通过 Hook 模型创建 manager
const manager = createManager({ foo, bar, baz });

// 3. 创建插件
const plugin1 = manager.createPlugin(() => {
    return {
        foo: (count, next) => {
              return next(count + 1)
        },
        bar: (count) => {
              return count + 1
        },
        baz: (count) => {
              return count + 1
        }
    }
})

const plugin2 = manager.createPlugin(() => {
    return {
        foo(count, next) => {
              return count * 2
        },
        bar(count) => {
              return count * 2
        },
        baz(count) => {
              return count * 2
        }
    }
})

// 4. 将插件添加至 Manager
manager.usePlugin(plugin1, plugin2)

// 5. 初始化 runner
const runner = manager.init()

// 6. 通过 runner 执行各个 Hook 模型
runner.foo(1) // 4
runner.foo(5) // 12

runner.bar(1) // 4
runner.bar(5) // 12

runner.baz(1) // [2, 2]
runner.baz(5) // [6, 10]
```

使用 Manger 的方式和顺序基本就和上面示例中所展示的一致：

1. 创建所需的 Hook 模型
2. 通过 Hook 模型创建 Manager
3. 创建插件
4. 将插件添加至 Manager
5. 初始化 Runner
6. 通过 Runner 执行各个 Hook 模型

其中创建插件时，是通过 Manger 的 `createPlugin` 函数创建，不同 Manager 的插件并不通用，需要传入只一个函数，该函数返回一个对象，对象中对应的是与 Hook 模型同名的函数。

需要注意的是一个插件中不需要为所有 Hook 模型都提供函数，没有提供的则会跳过，甚至可以不为任何一个 Hook 模型提供函数，只会执行初始化函数。

还提供了可以动态注册（在执行插件的时候）Hook 模型，这个的细节之后会提到，这里需要区分是动态注册 Hook 模型，而不是插件。

同样的 Manager 也同时提供了 Sync 版本和 Async 版本，但 Manager 的类型和 Hook 模型的类型没有关系，可以灵活组合，这里的 Sync 和 Async 只会影响插件初始化函数的类型。

## 动态注册 Hook 模型

为了支持动态注册，Manager 中提供了一个 `register` 函数，通过该函数就可以添加新的 Hook 模型，无法覆盖原有的同名 Hook 模型。下面通过一个例子来看一下：

```ts
import {
    createManager,
    createPipeline,
    createWaterfall,
    createWorkflow
} from '@modern-js/plugin'

// 1. 创建 Hook 模型
const foo = createPipeline<number, number>()
const baseHooks = { foo }


export interface Hooks {}

// 2. 通过 Hook 模型创建 manager
const manager = createManager<Hooks, typeof baseHooks>(baseHooks);


// 2.1.1 创建需要动态注册的 Hook 模型
const bar = createWaterfall<number>()
const baz = createWorkflow<number, number>()

// 2.1.2 注册新的 Hook 模型
manager.register({
    bar,
    baz
})

// 2.1.3
export interface Hooks {
    bar: typeof bar;
    baz: typeof baz;
}

// 3. 创建插件
const plugin1 = manager.createPlugin(() => {
    // 2.2.1 创建需要动态注册的 Hook 模型
    const bar = createWaterfall<number>()
    const baz = createWorkflow<number, number>()

    // 2.2.1 注册新的 Hook 模型
    manager.register({
        bar,
        baz
    })

    return {
        foo(count, next) => {
              return next(count + 1)
        },
        bar(count) => {
              return count + 1
        },
        baz(count) => {
              return count + 1
        }
    }
})

const plugin2 = manager.createPlugin(() => {
    return {
        foo(count, next) => {
              return count * 2
        },
        bar(count) => {
              return count * 2
        },
        baz(count) => {
              return count * 2
        }
    }
})

// 4. 将插件添加至 Manager
manager.usePlugin(plugin1, plugin2)

// 5. 初始化 runner
const runner = manager.init()

// 6. 通过 runner 执行各个 Hook 模型
runner.foo(1) // 4
runner.foo(5) // 12

runner.bar(1) // 4
runner.bar(5) // 12

runner.baz(1) // [2, 2]
runner.baz(5) // [6, 10]
```

如上面例子中，需要动态注册 Hook 模型，除了按照正常方式执行之外，需要创建需要动态注册的 Hook 模型和调用 `register` 来注册新的 Hook 模型，除此之外如果需要完善的 TypeScript 则还需要特别处理下面这里地方：

```ts
const foo = createPipeline<number, number>()
const baseHooks = { foo }


export interface Hooks {}

// 2. 通过 Hook 模型创建 manager
const manager = createManager<Hooks, typeof baseHooks>(baseHooks);

/** ... */

// 2.1.3
export interface Hooks {
    bar: typeof bar;
    baz: typeof baz;
}
```

提供一个方便扩展的 Hooks 空的 `interface`（L5），然后将这个 Hooks 和 `baseHooks` 的类型作为泛型参数传入，之后在注册完成之后还需要通过 TypeScript 的 Declaration Merging 特性来补充对应的类型（L13）。
动态注册的地方也需要注意，需要在 `manager.int` 结束之前，即可以在插件初始化函数中，但不能在插件 Hook 函数中。

## 插件函数中获得 Runner

除了动态注册之外，这里也提供了一个获取 Runner 的函数：`Manager.useRunner`，通过这个函数可以在插件 Hook 函数中拿到当前的 Runner。需要注意的是，执行在插件 Hook 函数中，其他地方使用则会报错。使用示例如下：

```ts
const foo = createPipeline();
// eslint-disable-next-line @typescript-eslint/no-shadow
const bar = createPipeline();
const manager = createManager({ foo, bar });

let count = 0;

const plugin = manager.createPlugin(() => ({
  foo: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const runner = useRunner();
    runner.bar();
  },
  bar: () => {
    count = 1;
  },
}));

manager.usePlugin(plugin);
const runner = manager.init();
runner.foo({});

console.log(count); // 1
```

可以看到，通过 `useRunner` 拿到 Runner，就可以在插件 Hook 函数中执行其他的 Hook

## 插件之间的关系：排序、互斥、必需

Modern.js 的插件系统还提供了排序的功能，在 `Manager.createPlugin` 的第二个参数中可以传入三个参数来控制插件顺序：

* `name: string`，设置当前插件的名字
* `pre: string[]`，需要排在当前插件前面的插件的名字
* `post: string[]`，需要排在当前插件后面的插件的名字

还有一个参数用来实现插件互斥的功能：

* `rivals: string[]`，遇到有这些名字的插件会报错

和一个参数实现必需功能

* `required: string[]`，添加的插件列表中没有这些名字的插件会报错
