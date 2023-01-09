---
sidebar_position: 4
title: 衍生状态
---

一些场景中，组件需要对 Model 中的 State 进行进一步计算，才能在组件中使用，这部分逻辑可以直接写在组件内部，也可以通过 Model 的衍生状态实现。
衍生状态定义在 Model 中的 `computed` 字段下。根据依赖的 Model 的不同、返回类型的不同，衍生状态的定义方法可以分为以下 3 种。

## 只依赖自身的 State

衍生状态只依赖当前 Model 的 State，State 会作为第一个参数，传入衍生状态的定义函数中。

例如， todo 应用的 State 有 `items` 和 `filter`，`filter` 用于过滤当前页面显示的 todo 项，所以我们定义了一个 `visibleTodos` 的衍生状态可以直接在组件中使用。示例代码如下：

```ts
/**
 *  假设 todo item 结构如下：
{
    id: string;          // id
    text: string;        // todo 事项
    completed: boolean;  // 完成状态：0 代表未完成，1 代表完成
}
**/

const todoModel = model('todo').define({
  state: {
    items: [],
    filter: 'ALL', // ALL: 显示全部；COMPLETED：显示完成的事项；ACTIVE：显示未完成的事项
  },
  computed: {
    visibleTodos: state => {
      switch (state.filter) {
        case 'ALL':
          return state.items;
        case 'COMPLETED':
          return todos.filter(t => t.completed);
        case 'ACTIVE':
          return todos.filter(t => !t.completed);
        default:
          return [];
      }
    },
  },
});
```

衍生状态最终会和 Model 的 State 进行合并，因此，可以通过 Model 的 State 对象访问到衍生状态，例如，`visibleTodos` 在组件内的使用方式如下：

```ts
function Todo() {
  const [state, actions] = useModel(todoModel);

  return (
    <div>
      <div>
        {state.visibleTodos.map(item => (
          <div key={item.id}>{item.text}</div>
        ))}
      </div>
    </div>
  );
}
```

## 依赖其他 Model 的 State

除了依赖当前 Model 的 State，衍生状态还依赖其他 Model 的 State，这时候衍生状态的定义格式为：

```ts
[stateKey]: [...depModels, (selfState, ...depModels) => computedState]
```

下面的示例，演示了 `barModel` 的衍生状态 `combinedValue` 是如何依赖 `fooModel` 的 State 的。

```ts
const fooModel = model('foo').define({
  state: {
    value: 'foo',
  },
});

const barModel = model('bar').define({
  state: {
    value: 'foo',
  },
  computed: {
    combinedValue: [
      fooModel,
      (state, fooState) => state.value + fooState.value,
    ],
  },
});
```

## 函数类型的衍生状态

衍生状态还可以返回一个函数。这时候衍生状态的定义格式为：

```ts
[stateKey]: (state) => (...args) => computedState    // 只依赖自身的 state
[stateKey]: [...depModels, (selfState, ...depModels) => (...args) => computedState]  // 依赖其他 Model 的 state
```

假设，todo 应用的 state 不存储 `filter` 状态，而是直接在组件中使用，那么 `visibleTodos` 可以是一个函数类型的值，这个函数在组件中使用的时候，接收 `filter` 参数。如下所示：

```ts
const todoModel = model('todo').define({
  state: {
    items: [],
  },
  computed: {
    visibleTodos: state => filter => {
      switch (filter) {
        case 'ALL':
          return state.items;
        case 'COMPLETED':
          return todos.filter(t => t.completed);
        case 'ACTIVE':
          return todos.filter(t => !t.completed);
        default:
          return [];
      }
    },
  },
});

function Todo(props) {
  // filter 状态通过 props 传入
  const { filter } = props;
  const [state, actions] = useModel(todoModel);

  // 计算得到最终要显示的 todos
  const todos = state.visibleTodos(filter);

  return (
    <div>
      <div>
        {todos.map(item => (
          <div key={item.id}>{item.text}</div>
        ))}
      </div>
    </div>
  );
}
```

:::info 更多参考
[使用 Model](/docs/guides/topic-detail/model/computed-state)
:::
