---
sidebar_position: 6
---

# createStore

:::info 补充信息
通过 `createStore` 可以在 **React** 组件外消费 **Model**。也可以创建多个 **store** 来拆分状态。
如在工具函数中访问 **state**、执行 **actions** 时可利用 `createStore` 获取工具函数来消费 **Model**。
```ts
import { createStore } from '@modern-js/runtime/model';
```
:::


## API

`createStore(config) => ReduxStore & { use: UseModel }`

### 参数


- config：`object`，store 配置选项
  - initialState: Record<string, any>，用于设置全局 **store** 的初始状态。（一般用于 **SSR**，初始化数据）
  - reducer: `Reducer`
  - middlewares: `Middleware[]`
  - models: `Model[]`，在 App 入口中统一注册 **Models**。（正常使用无需提前注册）
  <!-- TODO: 注册有什么用？ -->
  - plugins: `Plugin[]`，注入插件，可注入的插件有（**router、immer、auto-action、machine** 等）。
  <!-- TODO: 插件列表、链接 -->
  - enhancers: `StoreEnhancer[]`，**Redux** `createStore` API 中 **enhancer** 配置，详见[介绍](https://redux.js.org/api/createstore)。

### 返回值

`createStore` 函数返回 `store`，`store` 是继承 [Redux Store](https://redux.js.org/tutorials/fundamentals/part-4-store#redux-store)，并在其上添加了 `use` 函数。

- use：`function`，获取 **Model** 的 **React Hook** 函数，用法与 [**useStaticModel**](../container/use-static-model.md) 相同，但可以在 **React** 组件外使用。
- ReduxStore：`ReduxStore`，详见 [**Redux Store**](https://redux.js.org/tutorials/fundamentals/part-4-store#redux-store)。
<!-- TODO: 没有 useStaticModel? -->
<!-- - `useStaticModel`：获取 **Model** 的 **React Hook** 函数，详见 [**useStaticModel**](../container/use-static-model.md)。 -->

## 示例
```tsx
import { createStore } from '@modern-js/runtime/model';

const store = createStore({});

function load() {
  const [, actions] = store.use(fooModel);

  actions.load();
}
```
