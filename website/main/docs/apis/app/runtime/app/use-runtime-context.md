---
sidebar_position: 2
---
# useRuntimeContext

:::info 补充信息
在 `React` 组件中获取 runtime 上下文，其中包含 `request` 和 `store` 实例。
```ts
import { useRuntimeContext } from '@modern-js/runtime';
```
:::

## API

`useRuntimeContext() => RuntimeContext`
### 返回值

- request：`object`，请求上下文中的附加信息。
  - params：`Record<string, string>`，请求路径中的动态参数。
  - pathname：`string`，请求的 pathname。
  - query：`Record<string, string>`，请求的查询字符串对象。
  - headers：`IncomingHttpHeaders`，请求头信息。
  - [cookie]：`string`，请求的 cookie 信息。
- store：`ReduckStore`，在开启了 state 插件的时候，该值为 reduck 全局 `store`。

## 示例

```tsx
import { useRuntimeContext } from '@modern-js/runtime';
import { fooModel } from '@/common/models';

function App() {
  const { store } = useRuntimeContext();

  const [state, actions] = store.use(fooModel);

  return <div>state: {state}</div>
}
```
