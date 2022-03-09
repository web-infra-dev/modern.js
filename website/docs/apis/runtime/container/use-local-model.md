---
sidebar_position: 3
title: useLocalModel
---

:::info 补充信息
用于在函数组件中消费局部状态。
```ts
import { useLocalModel } from '@modern-js/runtime/model';
```
:::

## API

`useLocalModel` API 形式上与 `useModel` 完全一致。具体使用请参考 [useModel](/docs/apis/runtime/container/use-model)。


## 示例

```tsx
function Container() {
  const [state, actions] = useLocalModel(modelA);
  const [state1, actions1] = useLocalModel(modelA);

  return ...;
}
```

上面通过 `useLocalModel` 加载了两次 `modelA`，因为 `useLocalModel` 消费的是局部状态（可以和 `useState` 进行类比），所以 `state` 和 `state1` 也是完全隔离的。
