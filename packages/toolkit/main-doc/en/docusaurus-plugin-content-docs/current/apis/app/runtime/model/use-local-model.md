---
sidebar_position: 4
title: useLocalModel
---

import ReduckTip from '@site-docs-en/components/reduck-tip.md'

<ReduckTip />

To use the State in the Model as a local state, the effect is similar to React's `useState`. `useLocalModel` API same as `useModel`. For detail, see [`useModel`](./use-model.md)。

## Example

```tsx
function Container() {
  const [state, actions] = useLocalModel(modelA);
  const [state1, actions1] = useLocalModel(modelA);

  // ...
}
```

`modelA` was loaded twice with useLocalModel above, because useLocalModel consumes local state, so state and state1 are also completely isolated.

:::info More
[Use Model](/docs/guides/topic-detail/model/use-model).
:::
