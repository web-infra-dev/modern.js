---
title: createApp
---

Used to create custom entries, custom runtime plugins. This API is only required when using [Custom App](/docs/guides/concept/entries#自定义-app).

## Usage

```ts
import { createApp } from '@modern-js/runtime';
```

## Function Signature

```ts
import type { Plugin } from '@modern-js/runtime';

function createApp(options: { plugins: Plugin[] }): React.ComponentType<any>;
```

### Input

- `options`: optional configuration.
  - `plugins`: custom plugin extensions.

## Example

### Create Custom Entry

For details, see [`bootstrap`](./bootstrap.md)。

### Custom Plugins

```ts
import { createApp } from '@modern-js/runtime';

function App() {
  return <div>app</div>;
}

export default createApp({
  plugins: [customPlugin()],
})(App);
```
