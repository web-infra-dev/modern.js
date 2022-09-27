---
sidebar_position: 1
title: model
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

:::tip 提示
Reduck 原始类型较为复杂，以下涉及类型定义的地方，展示的是简化后的类型信息。原始类型见 [**model**](https://github.com/modern-js-dev/reduck/blob/main/packages/store/src/model/model.ts)。
:::

## model

用于创建管理应用状态的 Model。

`function model(name: string): { define: function }`

- name：`string`，创建的 Model 的唯一标识。

```ts title="示例"
model('foo');
```

## define

用于定义 Model 的详细结构，支持传入一个对象类型或函数类型的参数。

### 对象类型

`function define(modelDesc: ModelDesc): Model;`

- modelDesc: `ModelDesc`，是对 Model 结构的定义，包含 `state`、`computed`、`actions`、`effects` 等属性。

```tsx title="示例"
const fooModel = model('foo').define({
  state: 'foo',
  computed: {
    cFoo: state => `c${state}`,
  },
  actions: {
    setState: (state, value) => {
      return value;
    },
  },
  effects: {
    loadState: async () => {
      // 从服务端获取 state
    },
  },
});
```

### 函数类型

`function define((context: Context, utils: Utils) => ModelDesc): Model;`

- context: Context，Reduck 上下文对象，可以获取底层的 `store` 对象。`store` 除支持 Redux Store 的所有 [API](https://redux.js.org/api/store) 以外，还挂载了用于消费 Model 的 `use` 的方法，和用于卸载 Model 的 `unmount` 方法。
- utils: Utils，定义 Model 时，常用的工具函数：`use`、`onMount`。`use` 作用同 `store` 对象上的 `use`，`onMount` 是 Model 挂载后的钩子函数。

<!-- TODO: @anchao 调整类型 -->
```ts
interface Utils {
  use: UseModel;
  onMount: OnMountHook;
}

interface Context {
  store: ReduxStore & {
    use: UseModel;
    unmount: (model: Model) => void;
  };
}
```

如通过 `use`，可以获取 Model 自身及其它 Model 的 `state`，`actions`。

```tsx title="示例"
const fooModel = model('foo').define(() => {
  return {
    state: 'foo',
    actions: {
      setState: (state, value) => {
        return value;
      },
    },
  };
});

const barModel = model('bar').define((_, { use }) => {
  return {
    state: 'bar',
    effects: {
      syncFoo() {
        const [state, actions] = use(fooModel);
        actions.setState(state);
      },
    },
  };
});
```

### 参数

#### ModelDesc.state

定义 Model 的状态。技术上，支持任意类型的 **state**，但是实践中建议使用可进行 JSON 序列化的类型。

```ts
interface ModelDesc {
  state: any;
}
```

#### ModelDesc.actions

定义 Model 的 Actions。Actions 的函数类型为：

```ts
interface ModelDesc {
  actions: {
    [actionKey: string]: (state: State, payload: any) => State | void;
  };
}
```

Reduck 内部集成了 [immer](https://github.com/immerjs/immer)，可以直接原始的 `state`，当 Action 没有显式返回值时，Reduck 内部会返回修改过的新的 State 对象。


#### ModelDesc.computed

定义 Model 的衍生状态。衍生状态的定义支持两种类型：

1. 只依赖 Model 自身的状态

```ts
interface ModelDesc {
  computed: {
    [computedKey: string]: (state: State) => any;
  };
}
```


2. 依赖其他 Model 的状态

```ts
interface ModelDesc {
  computed: {
    [computedKey: string]: [
      ...models: Model[],
      (state: State, ...args: ModelState[]) => any,
    ];
  };
}
```

```ts title="示例"
const fooModel = model('foo').define({
  state: 'foo',
});

const barModel = model('bar').define({
  state: 'bar',
  computed: {
    combineFoo: [fooModel, (state, fooState) => state + fooState],
  },
});
```

#### ModelDesc.effects

定义 Model 的 Effects。Effects 中定义的函数类型为：

```ts
interface ModelDesc {
  effects: {
    [effectKey: string]: (...args: any[]) => any;
  };
}
```

```ts title="示例"
const fooModel = model('foo').define((context, { use }) => ({
  state: 'foo',
  effects: {
    persist() {
      const [state] = use(fooModel);
      localStorage.setItem('state', state);
    },
  },
}));
```


:::info 更多参考
[创建 Model](/docs/guides/features/model/define-model)
:::
