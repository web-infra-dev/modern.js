---
sidebar_position: 8
title: 性能优化
---

Reduck 内部已经做了大量性能优化工作，一般情况下不需要考虑性能问题。不过当对性能比较敏感、或者遇到了性能问题，可以考虑从以下 3 个方面，进行更有针对性的性能优化。

## Model 拆分

当 `useModel` 返回 Model 对象的完整 State 时，State 任意部分的变化都会导致调用了 `useModel` 的组件重新渲染。

例如：

```ts
const fooModel = model('foo').define({
  state: {
    a: '',
    b: '',
  },
  actions: {
    setA(state, payload) {
      state.a = payload;
    },
    setB(state, payload) {
      state.b = payload;
    },
  },
});

function ComponentA() {
  const [state] = useModel(fooModel);

  return <div>{state.a}</div>;
}
```

组件 `ComponentA` 虽然只需要使用 `a` 状态，但当 `b` 状态发送变化时， `ComponentA` 仍然会重新渲染。这种情况，我们可以考虑把 `fooModel` 拆分，`a`、`b` 分别由不同的 Model 负责管理：

```ts
const fooModel = model('foo').define({
  state: {
    a: '',
  },
  actions: {
    setA(state, payload) {
      state.a = payload;
    },
  },
});

const barModel = model('bar').define({
  state: {
    b: '',
  },
  actions: {
    setB(state, payload) {
      state.b = payload;
    },
  },
});
```

## 状态筛选

`useModel` 支持传入 selector 函数，对返回给组件的 State 和 Actions 做筛选。我们可以通过 selector 函数，确保返回给组件的 State 是组件直接需要使用的，从而保证组件不会因为其他无关状态的变化而重新渲染。

对于上面同样的例子，我们采用 selector 函数进行性能优化，代码如下：

```ts
const fooModel = model('foo').define({
  state: {
    a: '',
    b: '',
  },
  actions: {
    setA(state, payload) {
      state.a = payload;
    },
    setB(state, payload) {
      state.b = payload;
    },
  },
});

function ComponentA() {
  // 通过传入 selector 函数，只返回 a 状态给组件
  const [stateA] = useModel(fooModel, state => state.a);

  return <div>{stateA}</div>;
}
```

## 衍生状态缓存

当 Model 存在 `computed` 时，每次调用`useModel` 都会执行 `computed` 函数。

考虑如下代码：

```ts
const barModel = model('bar').define({
  state: {
    value: 'bar',
  },
  computed: {
    combineA: [
      fooModel, // fooModel 定义同上
      (state, fooState) => {
        return state + fooState.a;
      },
    ],
  },
  actions: {
    setValue(state, payload) {
      state.value = payload;
    },
  },
});

function ComponentB() {
  const [state, actions] = useModel(fooModel);
  const [{ combineA }] = useModel(barModel);
  // 省略
}
```

`barModel` 的衍生状态 `combineA` 依赖 `barModel` 自身状态 和 `fooModel` 的状态 `a`，但是即使是 `fooModel` 的状态 `b` 发生了变化，组件重新渲染时， `combineA` （更准确的说法是 `combineA` 的最后一个函数类型的元素 ）依然会被调用执行。

一般情况下，`computed` 函数中的逻辑都是非常轻量的，但当 `computed` 函数逻辑比较复杂时，我们可以考虑对计算逻辑做缓存。例如，我们使用 [reselect](https://github.com/reduxjs/reselect) 对 `barModel` 的 `combineA` 做缓存：

```ts
import 'createSelector' from 'reselect';

// 创建缓存函数
const selectCombineA = createSelector(
  (state) => state.bar.value,
  (state) => state.foo.a,
  (barState, fooState) => {
    return barState + fooState;
  }
);

const barModel = model("bar").define({
  state: {
    value: "bar",
  },
  computed: {
    combineA: [
      fooModel,
      (state, fooState) => {
        return selectCombineA({
          foo: fooState,
          bar: state,
        });
      },
    ],
  },
  actions: {
    setValue(state, payload) {
      state.value = payload;
    },
  },
});
```

我们创建缓存函数 `createSelector`，仅当 `barModel` 的状态发生改变或 `fooModel` 的 `a` 状态发生改变时，才会重新计算 `combineA` 的值。

:::info 补充信息
本节完整的[示例代码](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/model/performance-optimization)
:::
