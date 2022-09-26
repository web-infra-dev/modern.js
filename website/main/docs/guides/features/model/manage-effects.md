---
sidebar_position: 5
title: 副作用管理
---

Model 中的 Action 必须是一个纯函数，执行过程中不会产生任何副作用。但在真实的业务中，我们会遇到很多副作用场景，如：请求 HTTP 接口获取状态数据，或者在更新状态的同时修改 localStorage、发送事件等。在 Reduck 中，是通过 Model 的 Effects 函数管理副作用的。

## 副作用对 State 修改

副作用修改 State，最常见的场景就是请求 HTTP 接口，更新状态数据。

我们以一个简单的 `todoModel` 为例。其有一个 `load` 的副作用函数，请求远端的 TODO 列表，请求成功之后更新 `state.items` 字段。

```ts
const todoModel = model('todo').define({
  state: {
    items: [],
    loading: false,
    error: null,
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
      },
    },
  },
  effects: {
    // Promise 副作用
    async load() {
      return new Promise(resolve => {
        setTimeout(() => resolve(['Learn Modern.js']), 2000);
      });
    },
  },
});
```

副作用函数统一定义在 `effects` 字段下。这里我们写了一个 `load` 函数，它返回一个 Promise，Promise 执行成功后，返回 TODO 列表 `["Lerna Modern.js"]`。

副作用函数需要和 actions 配合使用，才能完成状态的修改。因此，我们在 `actions` 中定义了一个 `load`（命名需要和 `effects` 下的副作用函数的名字保持一致）对象，包含 `pending`、`fulfilled`、`rejected` 3 个 action，分别是对副作用函数 `load` 返回的 `Promise` 的三种状态（ pending、fulfilled、rejected ）的处理：

- `pending`：接收当前状态 `state` 作为参数，新的状态中 `loading` 设为 `true`。
- `fulfilled`：接收当前状态 `state` 和 Promise fulfilled 状态的值 `items` 为参数，新的状态中 `items` 等于参数 `items`、`loading` 设为 `false`。
- `rejected`：接收当前状态 `state` 和 Promise rejected 状态的错误 `error` 为参数，新的状态中 `error` 等于参数 `error`、`loading` 设为 `false`。

组件中如何调用 effects 函数呢？ effects 函数会被合并到 actions 对象上，因此可以通过 actions 对象调用 effects 函数，如下所示：

```ts
function Todo() {
  const [state, actions] = useModel(todoModel);

  useEffect(() => {
    // 调用 effects 函数
    actions.load();
  }, []);

  if (state.loading) {
    return <div>loading....</div>;
  }

  return (
    <div>
      <div>
        {state.items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
}
```

上面的示例中， `pending`、`fulfilled`、`rejected` 3 个 action，对于用于获取数据的 HTTP 请求场景下，一般都是需要的。Reduck 提供了一个工具函数 `handleEffect`，用于简化这种场景下的 action 创建。

`handleEffect` 约定这种副作用场景下， Model 的 State 结构包含 `result`、`error`、`pending` 3 个字段，初始值为：

```ts
{
  result: null,
  error: null,
  pending: false，
}
```

调用 `handleEffect` 会返回如下数据结构:

``` ts
{
  pending() { // ... },
  fulfilled() { // ... },
  rejected() { // ... }
}
```

这个数据结构和我们在 `actions` 下的 `load` 对象的数据结构是相同的。`handleEffect` 返回的对象，其实就是对应了 Effects 函数需要的 3 个 action。


利用 `handleEffect`，改写 `todoModel`：

```ts
const todoModel = model('todo').define({
  state: {
    items: [],
    loading: false,
    error: null,
  },
  actions: {
    load: handleEffect({ result: 'items' }),
  },
  effects: {
    // Promise 副作用
    async load() {
      return new Promise(resolve => {
        setTimeout(() => resolve(['Learn Modern.js']), 2000);
      });
    },
  },
});
```

`handleEffect` 接收的参数对象，将 `result` 设置为 `item`。因为 `todoModel` 的 state，使用 `items` 作为 key 保存 todo 列表数据，而不是使用 `handleEffect` 默认的 `result` 作为 key，所以这里需要进行配置。

明显可见，通过 `handleEffect` 实现的 `todoModel` 比之前的实现有了很大精简。

如果不希望 pending、fulfilled、rejected 3 种状态都被 `handleEffect` 自动处理，例如 fulfilled 需要手动处理较复杂的数据类型，但是 pending、rejected 依旧想进行自动化处理，可以参考如下写法：

```ts
  actions: {
    load: {
      ...handleEffect(),
      fulfilled(state, payload) {
        // 手动处理
      },
    },
  },
```

:::info 补充信息
`handleEffect` [API](/docs/apis/runtime/model/handle-effect)。
:::


Effects 函数中，也支持手动调用 Actions，例如：

```ts
const todoModel = model('todo').define((context, utils) => ({
  state: {
    items: [],
    loading: false,
    error: null,
  },
  actions: {
    pending(state) {
      state.loading = true;
    },
    fulfilled(state, items) {
      state.items = items;
      state.loading = false;
    },
  },
  effects: {
    async load() {
      // 通过 utils.use 获取当前 Model 对象的 actions
      const [, actions] = utils.use(todoModel);
      // 手动调用 action
      actions.pending();

      return new Promise(resolve => {
        setTimeout(() => {
          const items = ['Learn Modern.js'];
          // 手动调用 action
          actions.fulfilled(items);
          resolve(items);
        }, 2000);
      });
    },
  },
}));
```

:::info 注
可以使用 `use` 函数加载其它 Model（包括 Model 自身），实现 [Model 间通信](/docs/guides/features/model/model-communicate)。
:::


## 副作用不影响 state

有些场景下，我们只需要读取 State，执行相关副作用逻辑，副作用不会修改 State。

例如，存储某些 State 到 `localStorage`：

```ts
const fooModel = model('foo').define((context, utils) => ({
  state: {
    value: 'foo',
  },
  effects: {
    setLocalStorage(key) {
      const [state] = utils.use(fooModel);
      localStorage.set(key, state.value);
      return 'success';
    },
  },
}));
```

或者是向服务端发送数据：

```ts
const fooModel = model('foo').define({
  state: {
    value: 'foo',
  },
  effects: {
    async sendData(data) {
      const res = await fetch('url', {
        method: 'POST',
        body: data,
      });
      return res.json();
    },
  },
});
```

## 副作用函数返回值

有时候，我们希望能根据副作用函数的执行结果，直接执行后续逻辑。这时候，就需要使用 Effects 函数的返回。

例如，当点击发送按钮，发送数据成功后，立即关闭当前的弹窗；如果失败，显示错误信息。我们可以通过如下代码实现：

```ts
// 代码仅做示意，不能执行
// 组件内部 发送按钮 的响应函数
const handleClick = async () => {
  // sendData 返回代表状态的字符串
  const result = await actions.sendData('some data');
  if (result === 'success') {
    // 关闭弹窗
    closeModal();
  } else {
    // 显示错误
    showError(result);
  }
};
```

:::info 补充信息
- [示例代码](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/effects)
:::
