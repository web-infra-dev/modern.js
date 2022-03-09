---
sidebar_position: 2
---

# state

:::info 补充信息
**state** 表示 **Model** 的状态。
:::

Modern.js 支持定义各种类型的 **state**。

## 示例

```ts
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define(() => {
  return {
    state: 'foo'
  }
});

function App() {
  const [state, actions] = useModel(fooModel);

  // "foo"
  return <div>state: {state}</div>
}
```
