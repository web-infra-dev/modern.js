---
sidebar_position: 5
title: 副作用管理
---

Model 中的 Actions 是一个纯函数，执行过程中不会产生任何副作用。但在真实的业务中，我们会遇到很多副作用场景，如：请求 HTTP 接口获取后更新状态，或者在更新状态的同时修改 localStorage、发送事件等。

根据副作用返回值类型的不同，分为三种副作用：

- Void 副作用。
- Promise 副作用。
- Thunk 副作用。


## Void 副作用。

Void 副作用无返回值。例如修改 localStorage 等场景：

```ts
const fooModel = model('foo').define({
  state: {
    value: 'foo'
  },
  effects: {
    // Void 副作用
    setLocalStorage(key: string, value: string) {
      localStorage.set(key, value);
    }
  }
});
```

## Promise 副作用

Promise 副作用返回一个 Promise 对象。这里以一个简单的 `todoModel` 为例。其有一个 `load` 的副作用函数，请求远端的 TODO 列表，成功之后更新 `state.items` 字段。

```ts
const todoModel = model("todo").define({
  state: {
    items: [],
    loading: false,
    error: null
  },
  actions: {
    load: {
      pending(state) {
        state.loading = true;
      },
      fulfilled(state, items) {
        state.items = items;
        state.loading = false;
      },
      rejected(state, error) {
        state.error = error;
        state.loading = false;
      }
    }
  },
  effects: {
    // Promise 副作用
    async load() {
      return new Promise((resolve) => {
        setTimeout(() => resolve(["Learn Modern.js"]), 2000);
      });
    }
  }
});
```

副作用函数都是统一管理在 `effects` 字段下的。这里我们写了一个 `load` 函数，它返回一个 Promise，Promise 执行成功时，返回 TODO 列表 `["Lerna Modern.js"]`。

`actions` 中有一个 `load`（和 `effects` 下的 `load` 函数对应）对象，
包含 `pending`、`fulfilled`、`rejected` 3个纯函数，分别是对`effects` 中的副作用函数 `load` 返回的 `Promise` 的三种状态（`pending`、`fulfilled`、`rejected`）的处理：

- `pending`：接收当前状态 `state` 作为参数，返回的状态设置 `loading` 为 `true`。
- `fulfilled`：接收当前状态 `state` 和 Promise fulfilled 状态的值 `items` 为参数，返回的状态设置 `items` 的值、并将 `loading` 设为 `false`。
- `rejected`：接收当前状态 `state` 和 Promise rejected 状态的错误 `error` 为参数，返回的状态设置 `error` 的值、并将 `loading` 设为 `false`。


## Thunk 副作用

Thunk 副作用同 Redux 中的 [Thunk](https://redux.js.org/usage/writing-logic-thunks)。Thunk 副作用返回一个函数，函数内部会异步地修改 Model 的状态。我们使用Thunk 副作用实现上述的 `todoModel`：

```ts
const todoModel = model("todo").define((context, { use }) => {
  return {
    state: {
      items: [],
      loading: false,
      error: null
    },
    actions: {
      load: {
        pending(state) {
          state.loading = true;
        },
        fulfilled(state, items) {
          state.items = items;
          state.loading = false;
        },
        rejected(state, error) {
          state.error = error;
          state.loading = false;
        }
      }
    },
    effects: {
      // Thunk 副作用
      load() {
        const [, actions] = use(todoModel);

        return () => {
          actions.load.pending();
          new Promise((resolve) => {
            setTimeout(() => resolve(["Lerna Modern.js"]), 2000);
          })
            .then((items) => actions.load.fulfilled(items))
            .catch((e) => actions.load.rejected(e));
        };
      }
    }
  };
});
```

`load` 副作用返回一个函数，异步地请求 TODO 列表，并在请求的回调函数（`then` 和 `catch`）手动调用 `actions.load.fulfilled` 和 `actions.load.rejected` 更新状态。

:::info 注
可以使用 `use` 函数加载其它 Model（包括 Model 自身），实现 [Model 间通信](/docs/guides/features/runtime/model/model-communicate)。
:::

:::info 补充信息
- 本节完整的示例代码：[副作用](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/effects)。

- 关于副作用相关 API 的更多介绍，请参考[副作用 API](/docs/apis/runtime/model/effects)。
:::
