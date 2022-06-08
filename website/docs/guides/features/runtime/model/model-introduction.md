---
sidebar_position: 1
title: Model 介绍
---

Modern.js 中引入 Model 的概念作为应用状态管理模型。Model 用来封装业务数据和数据处理方法，在代码组织上与 View（视图）分离。

:::info 注
Modern.js 的 Model 基于 [Redux](https://redux.js.org/) 实现，提供更高层级的抽象，并完全兼容 Redux 生态。
:::

下来我们以一个基础的 `countModel` 为例，演示如何创建一个 Model：

```ts
import { model } from '@modern-js/runtime/model';

const countModel = model("count").define({
  state: {
    value: 1
  },
  actions: {
    add(state) {
      return {
        ...state,
        value: state.value + 1
      };
    }
  }
});

export default countModel;
```

我们使用 `model` 函数创建了一个名为 `count` 的 Model，Model 里定义了 `state` 和 `actions`。

- `state` 表示计数器状态，它是业务逻辑相关的数据。
- `actions` 里可以添加更新状态的纯函数，它是对数据的处理方法。它接收当前的状态 `state` 作为入参，返回一个新的状态。

## 以 Mutable 方式更新 State

上述的 `add` 函数是一个纯函数，不直接更新 `state`，而是返回新的对象。这就保证了 Model 的 `state` 是 [Immutable](https://en.wikipedia.org/wiki/Immutable_object) 的。
Modern.js 默认也支持了以 Mutable 的方式操作 `state`（基于 [Immer](https://github.com/immerjs/immer) 实现）。

如下可以把 `add` 函数改造成 Mutable 方式操作 `state`：

```ts
import { model } from '@modern-js/runtime/model';

const countModel = model("count").define({
  state: {
    value: 1
  },
  actions: {
    add(state) {
      state += 1;
    }
  }
});

export default countModel;
```

上面就是 Model 的创建，你可能还想了解：[如何使用 Model](./use-model.md)。

:::info 补充信息
相关 API 的更多介绍，请参考[这里](/docs/apis/runtime/model/model_)。
:::
