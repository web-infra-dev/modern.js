---
title: defineConfig
---

For dynamically configuring applications runtime features.

## Usage

```ts
import { defineConfig } from '@modern-js/runtime';
```

Runtime configurations can usually be configured under the `runtime` of the `modern.config.js`, such as the [router](/docs/configure/app/runtime/router) configuration.

The configuration in `modern.config.js` is determined at build time，If some configuration parameters are obtained at runtime, or if the configuration parameters are from a module (such as a component), then need use `defineConfig` API configuration on runtime.

:::info
`@modern-js/app-tools` has the same name API, Used to provide **TS type for configuration**, please distinguish them.
:::

## Function Signature

```ts
function defineConfig(Component, config): any;
```

### Input

- Component: App root Component。
- config: runtime config。

## Example

```tsx
function App () {
  ...
}

defineConfig(App, {
  router: {
    supportHtml5History: false
  }
})
```


1. `defineConfig` can configuring [runtime.state](/docs/configure/app/runtime/state)、[runtime.router](/docs/configure/app/runtime/router) etc.

2. `defineConfig` before configuring a property, such as `router`, you need to make sure that the `modern.config.js` has been configured to enable this feature.

3. `defineConfig` incoming configuration will be merged with the configuration in `modern.config.js`. Taking `router` as an example, the final application configuration is as follows:

```json
{
  // 来自 `modern.config.js` 配置
  ...runtime.router
  // 来自 `defineConfig` 配置
  ...config.router
}
```
