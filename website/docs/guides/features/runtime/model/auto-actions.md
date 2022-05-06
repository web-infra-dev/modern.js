---
sidebar_position: 6
title: 自动生成 Actions
---

在【[Model 介绍](/docs/guides/features/runtime/model/model-introduction)】中，我们实现最简单的计数器 Model 也需要 10 行代码。
实际上，Modern.js 支持根据声明的 `state` 类型，自动生成常用的 Actions，从而简化模板代码量。当前支持的类型有：

- 原始数据类型
- 数组类型
- 简单对象类型（Plain Object）

## 原始数据类型

```ts
const countModel = model('count').define({ state: 1 });
```

如上我们仅用一行就完成了一个简单的 `countModel`。使用 Model 的示例代码如下：

```tsx
function Counter() {
  const [state, actions] = useModel(countModel);

  useEffect(() => {
    // 增加 1
    actions.setState(state + 1)
  }, [])
}
```

## 数组类型

当 State 为数组类型时，自动生成 Actions 的示例代码如下：

```ts
const countModel = model('count').define({ state: [] });

function Counter() {
  const [state, actions] = useModel(countModel);

  useEffect(() => {
    actions.push(1);
    actions.pop();
    actions.shift(),
    actions.unshift(1),
    actions.concat([1]),
    actions.splice(0, 1, 2),
    actions.filter(value => value > 1);
  }, [])
}
```

我们可以使用 JavaScript Array 对象的方法，修改 State。

## 简单对象类型

当 State 为简单对象类型时，自动生成 Actions 的示例代码如下：

```ts
const countModel = model('count').define({ state: {
  a: 1,
  b: [],
  c: {}
} });

function Counter() {
  const [state, actions] = useModel(countModel);

  useEffect(() => {
    actions.setA(2);
    actions.setB([1]);
    actions.setC({a: 1});
  }, [])
}
```

根据 `a`、`b`、`c` 三个不同的字段分别生成 `setA`、`setB`、`setC` 三个 Actions。

:::info 注
当用户自定义的 Action 和 Modern.js 自动生成的 Action 名字一致时，用户自定义的 Action 优先级更高。例如，
在 `countModel` 中已经自定义 `setA` 这个 Action，调用 `actions.setA()` 时，最终执行的是用户自定义的 `setA`。
:::


:::info 补充信息
相关 API 的更多介绍，请参考[这里](/docs/apis/runtime/model/auto-actions)。
:::
