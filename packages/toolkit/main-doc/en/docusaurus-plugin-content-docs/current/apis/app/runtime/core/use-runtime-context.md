---
title: useRuntimeContext
---

This function is mainly used to get the runtime context and can only be used in function components.

## Usage

```tsx
import { useRuntimeContext } from '@modern-js/runtime';

export function App() {
  const runtimeContext = useRuntimeContext();
  return <div>Hello World</div>;
}
```

## Function Signature

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

### Return Value

- `request`: additional information in the request context.
  - `params`: dynamic parameters in the request path.
  - `pathname`: the pathname of the request.
  - `query`: the query of the request.
  - `headers`: the header info of the request.
  - `cookie`: the cookie of the request.
- `store`: when the runtime.state is enabled, this value is the reduck global `store`.

## Example

```tsx
import { useRuntimeContext } from '@modern-js/runtime';
import { fooModel } from '@/common/models';

function App() {
  const { store } = useRuntimeContext();

  const [state, actions] = store.use(fooModel);

  return <div>state: {state}</div>;
}
```
