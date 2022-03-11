---
sidebar_position: 3
title: 局部状态管理
---

有些场景下，我们可能需要将 Model 中的状态作为局部状态使用，即，对一个 Model 中的状态修改，不会影响到其他使用该 Model 的组件。这种情况可以使用 `createApp` API。

## `createApp` 基本使用

```ts
const { Provider, useModel } = createApp();
```

`createApp` 返回一对 `Provider` 和 `useModel`，`Provider` 是提供者，`useModel` 是消费者，消费其对应的 `Provider` 所提供的状态。

:::info 补充信息
相关 API 的更多介绍，请参考[这里](/docs/apis/runtime/app/create-app)。
:::

## 使用局部状态

修改计数器应用的代码，添加一个有局部状态的计数器组件 `LocalCounter`。

```tsx
import { useModel, createApp } from "@modern-js/runtime/model";
import countModel from "./models/count";

const {
  Provider: LocalCounterProvider,
  useModel: useLocalCounterModel
} = createApp({});

function LocalCounter() {
  const [state, actions] = useLocalCounterModel(countModel);

  return (
    <div>
      <div>local counter: {state.value}</div>
      <button onClick={() => actions.add()}>add</button>
    </div>
  );
}


function Counter() {
  const [state, actions] = useModel(countModel);

  return (
    <div>
      <div>counter: {state.value}</div>
      <button onClick={() => actions.add()}>add</button>
    </div>
  );
}

export default function App() {
  return <LocalCounterProvider>
    <Counter />
    <LocalCounter />
  </LocalCounterProvider>;
}
```

- 我们执行 `createApp` 生成 `LocalCounterProvider` 和 `useLocalCounterModel`，分别用于局部状态的提供者和消费者。
- `LocalCounter` 组件里使用 `useLocalCounterModel` 消费 Model。
- 根组件使用 `LocalCounterProvider` 包裹。

最终效果如下：

![local-model](https://lf3-static.bytednsdoc.com/obj/eden-cn/eueh7vhojuh/modern/local-model.gif)


分别点击 `Counter` 和 `LocalCounter` 的 `add` 按钮，两者的状态互不影响。

本节完整的示例代码可以在[这里](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/local-model)查看。
