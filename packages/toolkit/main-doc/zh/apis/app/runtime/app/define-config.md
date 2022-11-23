---
sidebar_position: 1
title: defineConfig
---

用于动态配置应用。

## 使用姿势

```ts
import { defineConfig } from '@modern-js/runtime';
```

Runtime 配置通常可以在 `modern.config.js` 的 `runtime` 空间下配置。如 [router](/docs/configure/app/runtime/router) 配置。
但因为 `modern.config.js` 是前端源码外的文件，如果一些配置参数是运行时获取的，或者配置参数是来自于源码中的一个模块（如组件），就需要使用 `defineConfig` API 进行运行时配置。

:::info
`@modern-js/app-tools` 拥有同名 API ，用于为配置**提供 TS 类型**，请开发者加以区分。
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


1. `defineConfig` 里可配置 [runtime.state](/docs/configure/app/runtime/state)、[runtime.router](/docs/configure/app/runtime/router) 等运行时配置。字段和 `modern.config.js` 下的 `runtime.features` 配置字段一致，注意**不需要 features 层级**。

2. `defineConfig` 在配置某个属性之前，如 `router`，需要确保 `modern.config.js` 已经配置开启了该功能。

3. `defineConfig` 传入的配置会和 `modern.config.js` 中的配置浅 merge，以 `router` 为例，最终应用的配置如下。

```json
{
  // 来自 `modern.config.js` 配置
  ...runtime.router
  // 来自 `defineConfig` 配置
  ...config.router
}
```
