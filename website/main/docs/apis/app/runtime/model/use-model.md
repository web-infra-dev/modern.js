---
sidebar_position: 2
title: useModel
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

:::tip 提示
Reduck 原始类型较为复杂，以下涉及类型定义的地方，展示的是简化后的类型信息。原始类型见 [model](https://github.com/modern-js-dev/reduck/blob/main/packages/store/src/model/useModel.ts)。
:::


```ts
function useModel(
  models: Models[],
  stateSelector?: StateSelector,
  actionSelector?: ActionSelector,
): [state, actions, subscribe];
function useModel(
  ...models: Models[],
  stateSelector?: (...args: State[]) => any,
  actionSelector?: (...args: Actions[]) => any,
): [state, actions, subscribe];
```


## 参数

- models：Model 对象数组，可以作为一个数组类型的参数传入，也可以所有 Model 逐个作为参数传入。
- stateSelector：可选参数，用于筛选 State 计算。前 n 个参数为 n 个 Model 对应的 State，返回的数据作为 `useModel` 返回值数组的第一个元素。
- actionSelector：可选参数，用于筛选 Actions 计算。前 n 个参数为 n 个 Model 对应的 Actions，返回的数据作为 `useModel` 返回值数组的第二个元素。


## 返回值

返回一个数组，每一项元素分别为：

- state： `stateSelector` 的返回值。如果未传 `stateSelector`，会把传入的所有 Model 的 State (包含衍生状态)合并后返回。如果不同 Model 的 State 中存在同名属性，后面的 State 会覆盖前面的 State 。当 `state` 发生变化时，调用 `useModel` 的组件会重新渲染。
- actions：第二个元素为 `actionSelector` 的返回值。如果未传 `actionSelector`，会把传入的所有 Model 的 Actions (包含 Effects) 合并后返回。如果不同 Model 的 Actions 中存在同名属性，后面的 Actions 会覆盖前面的 Actions 。
- subscribe：订阅 State 变化的函数。当传入的任意 Model 的 State 发生改变时，该函数会被调用。

## 示例

### 基本用法

```tsx
import todoModel from 'models/todo';
import filterModel from 'models/filter';

function Test(props) {
  const [state, actions] = useModel([todoModel, filterModel]);
  actions.add(); // 调用 todoModel add action
  actions.setVisibleStatus(); // 调用 filterModel filterModel action

  state.items; // 获取 todoModel state items
  state.visibleStatus; // 获取 filterModel state visibleStatus
}
```

### selector 用法

```js
function Test(props) {
  const [state, actions] = useModel(
    [todoModel, filterModel],
    (todoState, filterState) => ({
      items: todoState.items,
      visibleStatus: `${props.prefix}-${filterState.visibleStatus}`,
    }),
    (todoActions, filterActions) => ({
      ...todoActions,
      ...filterActions,
    }),
  );
  actions.add(); // 调用 todoModel add action
  actions.setVisibleStatus(); // 调用 filterModel filterModel action

  state.items; // 获取 todoModel state items
  state.visibleStatus; // 获取 filterModel state visibleStatus
}
```

:::info 更多参考
[使用 Model](/docs/guides/features/model/use-model)
:::
