---
sidebar_position: 9
title: useStore
---

import ReduckTip from '@site-docs-en/components/reduck-tip.md'

<ReduckTip />

`useStore` Used to get the store shared by the current component tree.


## Function Signature

```ts
function useStore(): ReduckStore;
```

### Return Type

- ReduckStore: Reduck Store，type refer to the return type of [createStore](./create-store.md).

## Example

```ts
// guarantee that getStore executes after the component tree mounted
setTimeout(() => {
  const store = getStore();
  const [, actions] = store.use(countModel);
  setInterval(() => {
    actions.add();
  }, 1000);
}, 1000);

function Counter() {
  const [state] = useModel(countModel);

  return (
    <div>
      <div>counter: {state.value}</div>
    </div>
  );
}
```

:::info More
[Use Model](/docs/guides/topic-detail/model/use-model).
:::
