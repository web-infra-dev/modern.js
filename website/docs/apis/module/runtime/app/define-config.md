---
sidebar_position: 12
title: defineConfig
---

:::info 补充信息
用于动态配置应用。
```ts
import { defineConfig } from '@modern-js/runtime';
```
:::

Runtime 配置通常可以在 `modern.config.js` 的 `runtime` 空间下配置，如 [runtime.router](/docs/apis/config/runtime/router) 等。
但如果一些配置参数是运行时获取的，或者配置参数是来自于源码中的一个模块（如组件），开发者就可以在 `modern.config.js` 使用 `defineConfig` API 进行运行时的配置。

:::info
`@modern-js/app-tools` 拥有同名 API ，用于**编译时配置定义**，请开发者加以区分。
:::

## API

`defineConfig(Component, config): any`

### 参数

- Component：`React.ComponentType<any>`，App 根组件。
- config：`Record<string, any>`，运行时的配置。

## 示例

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


1. `defineConfig` 里可配置 [runtime.state](/docs/apis/config/runtime/state)、[runtime.router](/docs/apis/config/runtime/router) 等运行时配置。字段和 `modern.config.js` 下的 `runtime` 配置字段一致。

2. `defineConfig` 在配置某个属性之前，如 `router`，需要确保 `modern.config.js` 已经配置开启了该功能。

3. `defineConfig` 传入的配置会和 `modern.config.js` 重的配置浅 merge，以 `router` 为例，最终应用的配置如下。

```json
{
  // 来自 `modern.config.js` 配置
  ...runtime.router
  // 来自 `defineConfig` 配置
  ...config.router
}
```
