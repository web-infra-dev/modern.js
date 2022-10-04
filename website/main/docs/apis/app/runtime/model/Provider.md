---
sidebar_position: 8
title: Provider
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

`Provider` 是一个组件，它将 Reduck 的 Store 注入到应用的组件树中，使组件树内部的组件可以访问 Model。一般情况下，`Provider` 会定义在组件树的最顶层。

## 类型

```ts
interface ProviderProps {
  store?: ReduckStore;
  config?: AppConfig;
}
```

## 参数

- store：可选。[`createStore`](./create-store.md) 创建的 Store 对象。
- config：可选。创建 Reduck Store 的配置，同 [`createApp`](./create-app.md) 的 `config` 参数。

## 示例
```tsx
// 应用入口文件

ReactDOM.render(
  <Provider>
    <App />
  </Provider>,
  document.getElementById('root'),
);
```
