---
sidebar_position: 5
title: connect
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

:::tip 提示
Reduck 原始类型较为复杂，以下涉及类型定义的地方，展示的是简化后的类型信息。原始类型见 [**connect**](https://github.com/modern-js-dev/reduck/blob/main/packages/react/src/connect.ts)。
:::

`connect` 功能上同 `useModel` 一致，是对应的 HOC 风格的 API。建议优先使用 Hook 风格的 `useModel`。


## 类型

```ts
function connect(models: Model, options?: ConnectOptions);
function connect(
  models: [...Model[], SelectStateToProps?, SelectActionsToProps?],
  options?: ConnectOptions,
);
```


## 参数
- models：传入的 1 个或 多个 Model，当 `models` 为数组类型参数时，最后两项元素可以是用于筛选 State 的函数（ `SelectStateToProps` 类型）和用于筛选 Actions 的函数（ `SelectActionsToProps` 类型）。
  - `SelectStateToProps` 类型为 `(...modelStates: State[], ownProps? :any) => PlainObject`， `modelStates` 是传入的 Model 对象的 State 组成的数组，`ownProps` 是当前组件接收外部传递的 `props`，`SelectStateToProps` 返回的数据会传递到组件的 `props` 上。当 `models` 中没有传入 `SelectStateToProps` 参数时，所有 Model 的 State 进行合并后传递到组件的 `props` 上。
  - `SelectActionsToProps` 类型为 `(...modelActions: Actions[], ownProps? :any) => PlainObject`， `modelActions` 是传入的 Model 对象的 Actions 组成的数组，`ownProps` 是当前组件接收外部传递的 `props`，`SelectActionsToProps` 返回的数据也会传递到组件的 `props` 上。当 `models` 中没有传入 `SelectActionsToProps` 参数时，所有 Model 的 Actions 进行合并后传递到组件的 `props` 上。

- options：可选参数，用于辅助配置。目前支持设置 `forwardRef`，用于控制是否转发组件的 `ref`，默认值为 `false`，表示不转发 `ref`。设置为 `{forwardRef: true}`，表示转发 `ref`。


## 返回值

返回一个高阶组件：接收一个传入的组件，返回一个在 `props` 上注入了额外 State 和 Actions 的组件。

## 示例

### 简单用法

```ts
const modelA = model('modelA').define({
  state: {
    a: 1,
  },
  actions: {
    incA(state) {
      return {
        ...state,
        a: state.a + 1,
      };
    },
  },
});

const modelB = model('modelB').define({
  state: {
    b: 10,
  },
  actions: {
    incB(state) {
      return {
        ...state,
        b: state.b + 1,
      };
    },
  },
});

function Test(props) {
  props.incA(); // 调用 modelA 的 action
  props.incB(); // 调用 modelB 的 action

  props.a; // 获取 modelA 的 state: a
  props.b; // 获取 modelB 的 state: b
}

export default connect([modelA, modelB])(Test);
```

### 筛选 State 和 Actions

```ts
function Test(props) {
  props.incAll();
  props.c;
}

const stateSelector = (stateA, stateB) => ({
  ...stateA,
  ...stateB,
  c: stateA.a + stateA.b,
});
const actionsSelector = (actionsA, actionsB) => ({
  ...actionsA,
  ...actionsB,
  incAll: () => {
    actionsA.incA();
    actionsB.incB();
  },
});

export default connect([modelA, modelB, stateSelector, actionsSelector])(Test);
```

### 转发组件的 ref

```ts
import { useRef, forwardRef } from 'react';

function Test(props, ref) {
  const { a, b } = props;

  return (
    <div ref={ref}>
      <span>{a}</span>
      <span>{b}</span>
    </div>
  );
}

const TestWrapper = connect([modelA, modelB], { forwardRef: true })(
  forwardRef(Test),
);

function App() {
  const testRef = useRef();

  return <TestWrapper ref={testRef} />;
}
```
