---
sidebar_position: 10
title: TS 最佳实践
---

Reduck 对 TS 提供了良好的支持，大部分使用场景下，无需任何额外工作，就可以直接获得 API 的 TS 类型提示。本节，将对其他的一些使用场景，做补充介绍。

## 定义 Model 的 State 类型

为 Model 的 State 声明类型信息，是在 TS 中使用 Reduck 的最佳实践。

```ts title="示例"
interface State {
  data: string
}

export const foo = model<State>('foo').define({
  state: {
    data: ''
  },
  computed: {
    withSuffix: (state) => state.data + 'suffix'
  },
  actions: {
    setData: (state, payload:string) => {
      state.data = payload
    }
  }
})
```

当为 Model 的 State 声明类型信息后，Model 的 `computed`、`actions` 都能获取正确的类型信息。事实上，上面的示例代码中，即使我们不定义 State 类型信息，也会根据 `state` 的初始值信息自动推导出 State 的类型信息。不过，仍然建议你在定义 Model 时，声明 State 的类型信息，因为根据 `state` 的初始值信息推导出的 State 类型信息可能不完整(缺少字段或字段的类型信息缺少)，而且当使用[函数类型](/docs/apis/app/runtime/model/model_#函数类型)定义 Model 时，State 的类型信息也是无法根据 `state` 的初始值信息自动推导的。

## 衍生状态的依赖类型

当 Model 的衍生状态依赖其他 Model 时，需要手动指定其他 Model 的 State。


```ts title="示例"
interface State {
  data: string
}

export const bar = model<State>('bar').define({
  state: {
    data: ''
  },
  computed: {
    // 为 fooState 指定类型
    withFoo: [foo, (state, fooState: FooState) => state.data + fooState.data]
  },
})
```

## 获取 Model 类型信息的 Hooks

Reduck 提供了一组用于获取 Model 类型信息的工具类型：

- `GetModelState`： 获取 Model 的 State（包含衍生状态）类型信息。
- `GetModelActions`：获取 Model 的 Actions（包含 Effects 函数）类型信息。

```ts title="示例"
export const foo = model<State2>('foo').define({
  // 省略
})

// 获取 foo 的 State 类型
let fooActions: GetModelActions<typeof foo>;
// 获取 foo 的 Actions 类型
let fooState: GetModelState<typeof foo>;
```
