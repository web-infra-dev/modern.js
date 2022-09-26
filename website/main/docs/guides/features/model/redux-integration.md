---
sidebar_position: 11
title: Redux 生态集成
---

Reduck 基于 Redux 实现，因此可以使用 Redux [生态的库](https://redux.js.org/introduction/ecosystem)，实现功能增强。通过 [`Provider`](/docs/apis/runtime/model/Provider) 、[`createApp`](/docs/apis/runtime/model/create-app) 和 [`createStore`](/docs/apis/runtime/model/create-store) 等 API ，可以设置使用 Redux 的 [中间件](https://redux.js.org/understanding/thinking-in-redux/glossary#middleware) 和 [Store Enhancer](https://redux.js.org/understanding/thinking-in-redux/glossary#store-enhancer)；使用 [`createStore`](/docs/apis/runtime/model/create-store) 还可以完全掌控 Store 的创建过程。

例如，我们希望使用中间件 [`redux-logger`](https://github.com/LogRocket/redux-logger)，示例代码如下：

```ts
ReactDOM.render(
  <Provider config={{ middlewares: [logger] }}>  // 通过 Provider 的 config 参数设置 中间件
    <App />
  </Provider>,
  document.getElementById('root')
);
```

:::caution
Reduck 基于 Redux 底层 API 做了上层封装，屏蔽了 Redux 的一些底层概念，如 Reducer 等。Reduck 对于 Model 是动态挂载的，而 Redux 是在 Store 创建时就会挂载应用所需的全部状态。基于这些实现上的差异，有些 Redux 生态的库是无法直接在 Reduck 中使用的。
:::
