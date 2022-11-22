---
sidebar_position: 4
title: useLocalModel
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

用于把 Model 中的 State 作为局部状态使用，效果类似 React 的 `useState`。`useStaticModel` API 形式上与 `useModel` 完全一致。具体使用请参考 [`useModel`](./use-model.md)。


#### 示例

```tsx
function Container() {
  const [state, actions] = useLocalModel(modelA);
  const [state1, actions1] = useLocalModel(modelA);

  // ...
}
```

上面通过 `useLocalModel` 加载了两次 `modelA`，因为 `useLocalModel` 消费的是局部状态，所以 `state` 和 `state1` 也是完全隔离的。

:::info 更多参考
[使用 Model](/docs/guides/features/model/use-model)
:::
