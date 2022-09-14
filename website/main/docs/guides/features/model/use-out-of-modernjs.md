---
sidebar_position: 12
title: 单独使用 Reduck
---

在 Modern.js 以外，单独集成 Reduck 使用时，主要需要做以下修改：

1. 安装 Reduck 相关包

在项目中安装 Reduck 包：`@modern-js-reduck/react`。


2. API 导入包名

在 Modern.js 中使用时，Reduck 导出 API 的包名为：`@modern-js/runtime/model`。单独使用 Reduck 时，导出包名为：`@modern-js-reduck/react`。


3. 包裹 `Provider` 组件

Modern.js 自动在应用的入口组件上，包裹了用于注入 Reduck 全局 Store 的 [`Provider`](/docs/apis/app/runtime/model/Provider) 组件。单独使用 Reduck 时，需要手动完成。

示例：
```tsx
// 根组件
const Root = () => {
  return (
    <Provider>
      {/* 应用入口组件 */}
      <App />
    </Provider>
  )
}
```


4. 功能配置

在 Modern.js 中使用时，可以通过 [`runtime.state`](/docs/apis/app/config/runtime/state) 对 Reduck 功能进行配置。单独使用时，需要通过 [`Provider`](/docs/apis/app/runtime/model/Provider) 的 `config` 或 `store` 参数配置。


示例：
```tsx
const Root = () => {
  return (
    {/* 关闭 Redux DevTools */}
    <Provider config={{ devTools: false }}>
      <App />
    </Provider>
  )
}
```
