---
title: useRuntimeContext
---

该函数主要用于获取 Runtime 上下文，只能在函数组件中使用。

## 使用姿势

```tsx
import { useRuntimeContext } from '@modern-js/runtime';

export function App() {
  const runtimeContext = useRuntimeContext();
  return <div>Hello World</div>;
}
```

## 函数签名

```ts
type RuntimeContext = {
  request: {
    params: Record<string, string>;
    pathname: string;
    query: Record<string, string>;
    headers: IncomingHttpHeaders;
    cookie: string;
  };
  store: ReduckStore;
};

function useRuntimeContext(): RuntimeContext;
```

### 返回值

- `request`：请求上下文中的附加信息。
  - `params`：请求路径中的动态参数。
  - `pathname`：请求的 pathname。
  - `query`：请求的查询字符串对象。
  - `headers`：请求头信息。
  - `cookie`：请求的 cookie 信息。
- `store`：在开启了 state 插件的时候，该值为 reduck 全局 `store`。

## 示例

```tsx
import { useRuntimeContext } from '@modern-js/runtime';
import { fooModel } from '@/common/models';

function App() {
  const { store } = useRuntimeContext();

  const [state, actions] = store.use(fooModel);

  return <div>state: {state}</div>;
}
```
