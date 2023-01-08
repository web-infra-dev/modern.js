---
title: bootstrap
---

Used to start and mount App, usually without manual calls。This API is only required when using [Custom App](/docs/guides/concept/entries#自定义-app).

## Usage

```ts
import ReactDOM from 'react-dom/client';
import { bootstrap } from '@modern-js/runtime';

bootstrap(App, 'root', undefined, ReactDOM);
```

## Function Signature

```ts
type BootStrap<T = unknown> = (
  App: React.ComponentType,
  id: string | HTMLElement | RuntimeContext,
  root?: any,
  ReactDOM?: {
    render?: Renderer;
    hydrate?: Renderer;
    createRoot?: typeof createRoot;
    hydrateRoot?: typeof hydrateRoot;
  },
) => Promise<T>;
```

### Input

- `AppComponent`: reactElement instance created by [`createApp`](./create-app).
- `rootId`: DOM root element id to mount，like `"root"`.
- `root`: ReactDOM.create the return value, which is used in the scenario where the root needs to destroy the component outside the bootstrap function.
- `ReactDOM`: ReactDOM object for distinguishing between React 18 and React 17 APIs.

## Example

```tsx
import ReactDOM from 'react-dom/client';
import { createApp, bootstrap } from '@modern-js/runtime';

function App() {
  return <div>Hello Modern.js</div>;
}

const WrappedApp = createApp({
  // customized plugin
  plugins: [customPlugin()],
})(App);

bootstrap(WrappedApp, 'root', undefined, ReactDOM);
```

:::info
since `@modern-js/runtime/plugins` is a alias，when used in a ts project, its type needs to be declared，Just add the following type declarations to `src/modern-app-env.d.ts`:

```ts
declare module '@modern-js/runtime/plugins';
```
:::

:::warning
bootstrap only supported for use in CSR.
:::
