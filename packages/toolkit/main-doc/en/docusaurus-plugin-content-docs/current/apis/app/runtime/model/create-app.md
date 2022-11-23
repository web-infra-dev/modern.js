---
sidebar_position: 11
title: createApp
---

import ReduckTip from '@site-docs/components/reduck-tip.md'

<ReduckTip />

Reduck will call `createApp` to create a global application by default. If the entire application only needs one Store, then there is no need to call `createApp` manually。Only need to use `createApp` when you need to create a Store locally in the app.

:::caution
Note that the exported `createApp` in `@modern-js/runtime/model` is used to manage state, while the exported `createApp` in `@modern-js/runtime` is used to create the entire application. The two are differently.
:::

## Function Signature

```ts
interface AppConfig extends StoreConfig {
  devTools?: boolean | DevToolsOptions;
  autoActions?: boolean;
}

function createApp(config: AppConfig): object;
```

### Input

- `config`
  - `StoreConfig`: the same as [`createStore`](./create-store.md) params.
  - `devTools`: the default value is `true`. when it is an object type，configuring [Options](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md) of Redux DevTools。
  - `autoActins`: the default value is `true`。if [auto generate Actions](./auto-actions.md)。

### Return Value

Reduck App, consists of the following properties:

- `Provider`: inject shared Store into locally component tree, same as [`Provider`](./Provider.md)。
- `useModel`: get the Model mounted by the app's local Store, same as [`useModel`](./use-model.md)。
- `useStaticModel`: get the Model mounted by the app's local Store. same as [`useStaticModel`](./use-static-model.md)。
- `useLocalModel`: get the Model mounted by the app's local Store. same as [`useLocalModel`](./use-local-model.md)。
- `useStore`: get the Store used locally by the app. same as [`useStore`](./use-store.md)。

## Example

use `createApp`, local states can be created to isolate the states between different Reduck applications.

```tsx
const { Provider: LocalFooProvider, useModel: useLocalFooModel } = createApp();
const { Provider: LocalBarProvider, useModel: useLocalBarModel } = createApp();

function Foo() {
  const [fooState] = useLocalFooModel(fooModel);
  const [barState] = useLocalBarModel(fooModel);

  return (
    <div>
      <div>Foo: {fooState}</div>
      <div>Bar: {barState}</div>
    </div>
  );
}

function Container() {
  return (
    <LocalFooProvider>
      <LocalBarProvider>
        <Foo />
      </LocalBarProvider>
    </LocalFooProvider>
  );
}
```
