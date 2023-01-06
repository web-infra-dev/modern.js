---
sidebar_position: 8
title: Provider
---

import ReduckTip from '@site-docs-en/components/reduck-tip.md'

<ReduckTip />

`Provider` is a component that injects Reduck's Store into the application's component tree, making the Model accessible to components inside the component tree. Normally, `Provider` is defined at the top level of the component tree.

## Function Signature

```ts
interface ProviderProps {
  store?: ReduckStore;
  config?: AppConfig;
}
```

### Input

- store: the Store object created by [`createStore`](./create-store.md).
- config: this config to create Reduck Store, same as `config` param in [`createApp`](./create-app.md).

## Example

```tsx title="App entry file"
ReactDOM.render(
  <Provider>
    <App />
  </Provider>,
  document.getElementById('root'),
);
```
