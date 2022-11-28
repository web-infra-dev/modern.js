---
title: bootstrap
---

Used to start and mount App, usually without manual calls。This API is only required when using [Custom App](/docs/guides/advanced-features/custom-app).

## Usage

```ts
import { bootstrap } from '@modern-js/runtime';

bootstrap(App, 'root');
```

## Function Signature

```ts
function bootstrap(AppComponent: React.ComponentType<any>, rootId: string): React.ComponentType<any> | void
```

### Input

- `AppComponent`: reactElement instance created by [`createApp`](./create-app).
- `rootId`: DOM root element id to mount，like `"root"`.

## Example

```tsx
import { createApp, bootstrap } from '@modern-js/runtime';
import { router, state } from '@modern-js/runtime/plugins';

function App() {
  return <div>Hello Modern.js</div>;
}

const WrappedApp = createApp({
  // customized plugin
  plugins: [router({}), state({})],
})(App);

bootstrap(WrappedApp, 'root');

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
