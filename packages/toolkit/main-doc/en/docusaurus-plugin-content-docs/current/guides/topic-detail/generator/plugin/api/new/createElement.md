---
sidebar_position: 2
---

# createElement

Create engineering elements that only support application engineering solutions.

This method is available on the `onForged` API parameter.

Its type is defined as:

```ts
export enum ActionElement {
  Entry = 'entry',
  Server = 'server',
}
export type ForgedAPI = {
  createElement: (
    element: ActionElement,
    params: Record<string, unknown>,
  ) => Promise<void>;
  ...
};
```

## element

Project element type, supports entry and server.

## params

For other parameters of creating elements, please refer to[MWA New Command](/docs/guides/topic-detail/generator/config/mwa).
