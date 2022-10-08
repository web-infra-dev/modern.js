---
sidebar_position: 10
title: createStore
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />


`createStore` 用于创建一个 Store 对象。Reduck 的 Store 基于 Redux 的 [Store](https://redux.js.org/api/store) 实现，用于存储应用的状态，同时提供一组用于管理状态和 Model 的方法。一般情况下，不需要使用这个 API，只有需要完全掌控 Store 的创建时，才会使用这个 API。例如，自定义一个 Store，传入 [`Provider`](./Provider.md) 组件使用。


## 类型

```ts
interface StoreConfig {
  initialState?: Record<string, any>;
  middlewares?: Middleware[];
  models?: Model[];
  plugins?: Plugin[];
  enhancers?: StoreEnhancer[];
}

interface ReduckStore extends ReduxStore {
  use: typeof useModel;
  unmount: (model: Model) => void;
}

function createStore(config: StoreConfig): ReduckStore;
```

### 参数

- config?：store 配置选项
  - initialState?: 设置全局 Store 的初始状态。
  - models?: 设置提前（Store 创建后）挂载到 Store 的 Model。（正常使用无需提前挂载）
  - middlewares?: 设置 Redux [中间件](https://redux.js.org/understanding/thinking-in-redux/glossary#middleware)。
  - enhancers?: 设置 Redux 的 [Store enhancer](https://redux.js.org/understanding/thinking-in-redux/glossary#store-enhancer) 。
  - plugins?: 设置 Reduck 插件。***试验性配置，不推荐使用***。

### 返回值

Reduck Store 对象：

- use：动态挂载和获取 Model 对象。用法与 [`useModel`](./use-model.md) 相同，但可以在 React 组件外使用。
- unmount：卸载 Model 对象，Model 的 State 会从 Store 中清除。
- ReduxStore：Redux Store 对象具有的方法，[详见](https://redux.js.org/tutorials/fundamentals/part-4-store#redux-store)。


## 示例
```tsx
const store = createStore();

function load() {
  const [, actions] = store.use(fooModel);

  actions.load();
}
```
