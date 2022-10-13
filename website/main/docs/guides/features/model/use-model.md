---
sidebar_position: 3
title: 使用 Model
---

## 在组件内使用
### 作为全局状态使用

通过 `useModel` 可以获取 Model 的 State、Actions 等。当 Model 的 State 通过 Actions 进行修改后，任何其他使用了该 Model 的组件，都会自动重新渲染。

在 [快速上手](/docs/guides/features/model/quick-start) 的计数器案例中，我们已经演示了 `useModel` 的使用，不再重复。

`useModel` 支持传入多个 Model，多个 Model 的 State 和 Actions 会进行合并后作为返回结果。例如：

```ts
const fooModel = model('foo').define({
  state: {
    value: 1,
  },
  actions: {
    add(state) {
      state += 1;
    },
  },
});

const barModel = model('bar').define({
  state: {
    title: 'bar',
  },
  actions: {
    set(state, payload) {
      state.title = payload;
    },
  },
});

const [state, actions] = useModel([fooModel, barModel]);
// 或
const [state, actions] = useModel(fooModel, barModel);
```

`state` 和 `actions` 的值分别为：

```ts
state = {
  value: 1,
  title: 'bar',
};

actions = {
  add(state) {
    state += 1;
  },
  set(state, payload) {
    state.title = payload;
  },
};
```

`useModel` 还支持对 State 和 Actions 做 selector 操作，实现对 State 和 Actions 的筛选或重命名，例如：


```ts
const fooModel = model('foo').define({
  state: {
    value: 1,
  },
  actions: {
    add(state) {
      state += 1;
    },
  },
});

const barModel = model('bar').define({
  state: {
    value: 'bar',
  },
  actions: {
    set(state, payload) {
      state.value = payload;
    },
  },
});

const [state, actions] = useModel(
  [fooModel, barModel],
  (fooState, barState) => ({
    fooValue: fooState.value,
    barValue: barState.value,
  }), // stateSelector
  (fooActions, barActions) => ({ add: fooActions.add }), // actionsSelector
);
```

我们通过 `stateSelector` ，把 `fooModel` 和 `barModel` 中重名的状态做了命名修改，通过 `actionsSelector` ，过滤掉了 `barModel` 的 Actions。

如果只需要设置 `actionsSelector`，可以把 `stateSelector` 设置为 `undefined`，作为参数占位。例如：

```ts
const [state, actions] = useModel(
  [fooModel, barModel],
  undefined,
  (fooActions, barActions) => ({ add: fooActions.add }), // actionsSelector
);
```

### 作为静态状态使用

通过 `useStaticModel` 获取 Model ，将 Model 中的状态作为静态状态使用。可以保证组件每次访问到的 Model 的 State 都是最新值，但是 Model 的 State 的变化，并不会引起当前组件的重新渲染。

:::info 注
`useStaticModel` 的使用方式和 `useModel` 完全一致。
:::

考虑下面一种场景，有一个组件 Input 负责用户输入，另外一个组件 Search 负责根据用户的输入信息，在点击查询按钮后执行查询操作，我们不希望用户输入过程中的状态变化引起 Search 重新渲染，这时候就可以使用 `useStaticModel`：

```ts
import { useStaticModel } from '@modern-js/runtime/model';

function Search() {
  // 这里注意不要解构 state
  const [state] = useStaticModel(searchModel);

  return (
    <div>
      <button
        onClick={async () => {
          const result = await mockSearch(state.input);
          console.log(result);
        }}
      >
        Search
      </button>
    </div>
  );
}
```

:::warning 注意
不要解构 `useStaticModel` 返回的 `state`，例如改成如下写法：
`const [{input}] = useStaticModel(searchModel);`
将始终获取到 Input 的初始值。
:::

`useStaticModel` 还适合和 [react-three-fiber](https://github.com/pmndrs/react-three-fiber) 等动画库一起使用，因为在动画组件 UI 里绑定会快速变化的状态，容易引起[性能问题](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls#never-bind-fast-state-reactive)。这种情况就可以选择使用 `useStaticModel`，它只会订阅状态，但不会引起视图组件的重新渲染。下面是一个简化示例：

```ts
function ThreeComponent() {
  const [state, actions] = useStaticModel(modelA);

  useFrame(() => {
    state.value; // 假设初始化为 0
    actions.setValue(1);
    state.value; // 这里会得到1
  });
}
```

使用 React 的 refs 也可以实现类似效果，其实 `useStaticModel` 内部也使用到了 refs。不过直接 `useStaticModel` 有助于将状态的管理逻辑从组件中解耦，统一收敛到 Model 层。

完整的示例代码可以在[这里](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/static-model)查看。

### 作为局部状态使用

通过 `useLocalModel` 获取 Model ，将 Model 中的状态作为局部状态使用。此时 Model State 的变化，只会引起当前组件的重新渲染，但是不会引起其他使用了该 Model 的组件重新渲染。效果和通过 React 的 `useState` 管理状态类似，但是可以将状态的管理逻辑从组件中解耦，统一收敛到 Model 层。

:::info 注
`useLocalModel` 的使用方式和 `useModel` 完全一致。
:::

例如，我们修改计数器应用的代码，添加一个有局部状态的计数器组件 `LocalCounter`：

``` ts
import { useLocalModel } from '@modern-js/runtime/model';

function LocalCounter() {
  const [state, actions] = useLocalModel(countModel);

  return (
    <div>
      <div>local counter: {state.value}</div>
      <button onClick={() => actions.add()}>add</button>
    </div>
  );
}
```

分别点击 `Counter` 和 `LocalCounter` 的 `add` 按钮，两者的状态互不影响：

![local-model](https://lf3-static.bytednsdoc.com/obj/eden-cn/eueh7vhojuh/modern/local-model.gif)

完整的示例代码可以在[这里](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/local-model)查看。



## 在组件外使用

在实际业务场景中，有时候我们需要在 React 组件外使用 Model，例如在工具函数中访问 State、执行 Actions 等。这个时候，我们就需要使用 Store。 Store 是一个底层概念，一般情况下用户接触不到，它负责存储和管理整个应用的状态。Reduck 的 Store 基于 [Redux 的 Store](https://redux.js.org/api/store) 实现，增加了 Reduck 特有的 API，如 `use` 。

首先，在组件内调用 `useStore` 获取当前应用使用的 `store` 对象，并挂载到组件外的变量上：

```ts
let store;  // 组件外部 `store` 对象的引用
function setStore(s) { store = s };
function getStore() { return store };

function Counter() {
  const [state] = useModel(countModel);
  const store = useStore();
  // 通过 useMemo 避免不必要的重复设置
  useMemo(()=> {
    setStore(store)
  }, [store])

  return (
    <div>
      <div>counter: {state.value}</div>
    </div>
  );
}
```

通过 `store.use` 可以获取 Model 对象，`store.use` 的用法同 `useModel` 相同。以计数器应用为例，我们在组件树外，每 1s 对计数器值
执行自增操作：

```ts
 setInterval(() => {
  const store = getStore();
  const [, actions] = store.use(countModel);
  actions.add();
}, 1000)
```

完整的示例代码可以在[这里](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/counter-model-outof-react)查看。

:::info 注
如果是通过 [`createStore`](/docs/apis/app/runtime/model/create-store) 手动创建的 Store 对象，无需通过 `useStore` 在组件内获取，即可直接使用。
:::

:::info 补充信息
本节涉及的 API 的详细定义，请参考[这里](/docs/apis/app/runtime/model/model_)。
:::
