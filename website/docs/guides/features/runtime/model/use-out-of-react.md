---
sidebar_position: 4
title: 在 React 组件外使用 Model
---

在实际业务场景中，我们可能需要在 React 组件外消费 Model。例如在工具函数中访问 `state`、执行 `actions` 等。这一节我们将演示如何在 React 组件外使用 Model。

## 创建 Store

首先需要创建一个 Store 对象，然后通过 Store 加载 Model。

```ts
const store = createStore();
```

这样我们就创建了一个 Store，底层使用的是 [Redux Store](https://redux.js.org/api/store)，所以你可以使用它的任何方法，如 [`getState`](https://redux.js.org/api/store#getstate)。
同时我们也兼容 Redux 丰富的中间件生态，可以在创建 Store 的时候传入 Redux 中间件：

```ts
const store = createStore({
  middlewares: [someMiddleware]
});
```

## 使用 Store 加载 Model

上面我们创建了 Store，接下来我们可以通过 `store.use` 函数将 `countModel` 挂载到 `store` 上。

例如：

```tsx
const [state, actions, subscribe] = store.use(countModel);

subscribe(() => {
  console.log('state changed', store.use(countModel)[0]); // state changed {value: 2}
});

console.log(state); // {value: 1}

actions.add();

console.log(store.use(countModel)[0]); // {value: 2}
```

代码依次打印：

```
{value: 1}
state changed {value: 2}
{value: 2}
```

`store.use` 返回 `state`、 `actions`、`subscribe`：

- `state`: 该 Model 的状态。
- `actions`: 修改 Model 状态的操作。
- `subscribe`: 用于监听 Model 更新的函数。

## 在计数器应用中使用

接下来，我们在计数器应用中，演示如何在组件外使用 Model。我们删除手动点击 `add` 按钮增加计数器值，而是在组件外通过一个定时任务每隔一秒钟自增一。

```ts
import { useModel, createStore, Provider } from "@modern-js/runtime/model";
import countModel from "./models/count";

const store = createStore();

const [, actions] = store.use(countModel);

setInterval(() => {
  actions.add();
}, 1000)

function Counter() {
  const [state, actions] = useModel(countModel);

  return (
    <div>
      <div>counter: {state.value}</div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
```

主要步骤总结如下：

- 使用 `createStore` 创建 `store`。
- 使用 `store.use(countModel)` 挂载 `countModel`，并获取 `state` 和 `actions`。
- 使用 `Provider` 组件包裹 `Counter` 组件，并传入上面创建的 `store`。

最终效果如下：

![counter-model-outof-react](https://lf3-static.bytednsdoc.com/obj/eden-cn/eueh7vhojuh/modern/model-outof-react.gif)


:::info 补充信息
本节完整的示例代码：[章节示例代码](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/counter-model-outof-react)。

- 相关 API 的更多介绍，请参考[这里](/docs/apis/runtime/model/create-store)。
:::
