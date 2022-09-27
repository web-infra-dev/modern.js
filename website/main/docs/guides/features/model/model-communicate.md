---
sidebar_position: 7
title: Model 通信
---

Model 通信，既指不同 Model 间的通信，也指同一个 Model 内部 Effects、Actions 之间的通信。

## Model 间通信

Model 之间不是孤立的，是可以进行通信的。主要分为两种场景：

1. 在 Model 中访问其它 Model 的 State 和 Actions。
2. 在 Model 中监听其它 Model 变化。

这里将 [快速上手](/docs/guides/features/model/quick-start) 一节的简单计数器应用改造成一个可设置步频的计数器应用。可以通过设置步频，从而影响每次计数器增加的幅度。

我们抽象出两个 Model，分别为 `stepModel`（步频）、`counterModel`（计数器）：

```ts
import { model } from '@modern-js/runtime/model';

const stepModel = model('step').define({
  state: 1,
});

const counterModel = model('count').define((context, { use, onMount }) => {
  const [, , subscribeStep] = use(stepModel);

  onMount(() => {
    return subscribeStep(() => {
      console.log(
        `Subscribe in counterModel: stepModel change to ${use(stepModel)[0]}`,
      );
    });
  });

  return {
    state: {
      value: 1,
    },
    actions: {
      add(state) {
        const step = use(stepModel)[0];
        state.value += step;
      },
    },
  };
});

export { stepModel, counterModel };
```

`stepModel` 只声明一个 `state`，初始值为 1。

`counterModel` 通过 `use` 函数加载 `stepModel`，拿到返回的 `subscribeStep` 函数，用来监听 `stepModel` 状态的变更。 `onMount` 是 Model 挂载完成后的钩子函数，`counterModel` 挂载完成后开始订阅 `stepModel` 状态的变更，打印出 `stepModel` 的最新值。

`counterModel` 通过 `use` 函数访问 `stepModel`，在 `add` 里可以获取到当前 `stepModel` 的值（步频），以此值来做自增。

:::caution 注意
当需要访问其他 Model 的 State 时，必须要在当前 Actions 或 Effects 函数（本例中对应 `add` 函数 ）真正执行的阶段调用 `use`，以保证获取的 State 是最新值。因此，我们虽然在 `define` 的回调函数中也调用了 `use(stepModel)`，但是我们并没有解构 `stepModel` 的 `state` 值，因为 `define` 的回调函数是在 Model 的挂载阶段执行的，这个时候获取到的 `stepModel` 的 `state` 可能和 `add` 执行时获取到的值是不同的。
:::

修改 **App.tsx**

```tsx
import { useModel } from '@modern-js/runtime/model';
import { counterModel, stepModel } from './models/count';

function Counter() {
  const [state, actions] = useModel(counterModel);
  const [step, stepActions] = useModel(stepModel);

  return (
    <div>
      <div>step: {step}</div>
      <button onClick={() => stepActions.setState(step + 1)}>add step</button>
      <div>counter: {state.value}</div>
      <button onClick={() => actions.add()}>add counter</button>
    </div>
  );
}

export default function App() {
  return <Counter />;
}
```

:::info 补充信息
Modern.js 默认开启 [自动生成 actions](./auto-actions.md)，所以 `stepModel` 中虽然没有手动定义 Actions，但可以使用自动生成的 `setState`。
:::

- 点击 **add step** 增加步频。
- 点击 **add counter** 触发计数器增加。

最终效果如下：

![communicate-models](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/models-communicate.gif)


:::info 补充信息
- 本节完整的[示例代码](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/models-communication)。
- 相关 API 的更多介绍，请参考：[model](/docs/apis/runtime/model/model_#函数类型)。
:::

前面 `counterModel` 的例子，我们是在 Actions 的函数内部调用 `use` 获取其他 Model 对象的。如果只需要调用其它 Model 的 Actions，因为 Actions 都是函数，不存在值过期问题，所以也可以在 `define` 的回调函数中调用 `use` 获取 Model 的 Actions。例如：

```ts
const barModel = model('bar').define({
  // 省略
});

const fooModel = model('foo').define((context, utils) => {
  // 获取 barModel 的 actions
  const [, actions] = utils.use(barModel);
  return {
    // 省略 state、actions
    effects: {
      async loadA() {
        // 省略副作用逻辑
        // 调用 barModel 的 action
        barModel.actionA();
      },
      async loadB() {
        // 省略副作用逻辑
        // 调用 barModel 的 action
        barModel.actionB();
      },
    },
  };
});
```

这样，我们不需要在 `loadA`、`loadB` 中重复获取 `barModel` 对象，简化了代码逻辑。


## Model 内通信

Model 内通信，也主要分为两种场景：

1. Effects 函数调用自身 Model 的 Actions 函数、或其他 Effects 函数。
2. Actions 函数调用自身 Model 的 其他 Actions 函数。

在 [副作用管理](/docs/guides/features/model/manage-effects)  一节，我们演示过 Effects 函数如何调用 Actions 函数。

这里我们再来举一个例子：

```ts
const fooModel = model('foo').define((context, { use, onMount }) => ({
  state: {
    a: '',
    b: '',
  },
  actions: {
    setA(state, payload) {
      state.a = payload;
    },
    setB(state, payload) {
      state.a = payload;
    },
  },
  effects: {
    async loadA() {
      // 通过 use 获取当前 Model 的 actions
      const [, actions] = use(fooModel);
      const res = await mockFetchA();
      actions.setA(res);
    },
    async loadB() {
      // 通过 use 获取当前 Model 的 actions
      const [, actions] = use(fooModel);
      const res = await mockFetchB();
      actions.setB(res);
    },
  },
}));
```

这个例子中，`fooModel` 的两个 Effects 函数，需要调用自身的 Actions 函数。这里我们在每个 Effects 函数中，都调用了一次 `use`，为什么不能像 Model 间通信的例子中，在 `define` 的回调函数中，统一调用 `use` 获取 Model 自身的 Actions 呢？这是因为调用 `use` 获取 Model 时，会先检查这个 Model 是否已经挂载，如果还没有挂载，会先执行挂载逻辑，而 `define` 的回调函数又是在 Model 的挂载阶段执行的，这样一来，在挂载阶段调用 `use` 获取 Model 自身，会出现死循环（代码实际执行过程会抛出错误）。所以，**一定不能在 `define` 的回调函数中，调用 `use` 获取 Model 自身对象。**

不过，我们可以利用 `onMount` 这个钩子函数，在 Model 挂载完成后，再通过 `use` 获取 Model 自身对象：

```ts
const fooModel = model('foo').define((context, { use, onMount }) => {
  let actions;

  onMount(() => {
    // fooModel 挂载完成后，通过 use 获取当前 Model 的 actions
    [, actions] = use(fooModel);
  });

  return {
    state: {
      a: '',
      b: '',
    },
    actions: {
      setA(state, payload) {
        state.a = payload;
      },
      setB(state, payload) {
        state.a = payload;
      },
    },
    effects: {
      async loadA() {
        const res = await mockFetchA();
        actions.setA(res);
      },
      async loadB() {
        const res = await mockFetchB();
        actions.setB(res);
      },
    },
  };
});
```

这样，我们也可以实现代码的简化。

