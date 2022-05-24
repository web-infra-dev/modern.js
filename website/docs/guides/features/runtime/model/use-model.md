---
sidebar_position: 1
title: 使用 Model
---

本文基于 [Model 介绍](./model-introduction.md) 一节创建的 `countModel` 为例，介绍 Model 的使用。

## 使用全局状态

```ts
import { useModel } from "@modern-js/runtime/model";
import countModel from "./models/count";

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
  return <Counter />;
}
```

- 在 `Counter` 组件中，通过 `useModel` API 使用 `countModel`，`useModel` 返回 Model 对象中保存的全局状态： `state` 和 变更状态的操作：`actions`。
- 当点击 `add` 按钮时，计数器自增一，并重新渲染 `Counter` 组件，更新视图。

最终效果如下：

![countModel](https://lf3-static.bytednsdoc.com/obj/eden-cn/eueh7vhojuh/modern/simple-count-model.gif)

本节完整的示例代码可以在[这里](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/counter-model)查看。

:::info 补充信息
相关 API 的更多介绍，请参考[这里](/docs/apis/runtime/model/model_))。
:::
