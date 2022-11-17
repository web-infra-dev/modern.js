---
sidebar_position: 11
title: createApp
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

一个 Reduck 应用对应共享一个 Store 的应用。Reduck 内部默认会使用 `createApp` 创建一个全局应用，如果整个应用只需要共享一个 Store，那么是不需要使用 `createApp` 的。只有当需要在应用局部创建共享 Store 时，才需要使用 `createApp` 。


:::caution 注意
- 注意 `@modern-js/runtime/model` 中导出的 `createApp` 用于管理状态，而 `@modern-js/runtime` 导出的 `createApp` 用于管理整个应用的运行时环境，两者功能不同。
:::

## 类型

```ts
interface AppConfig extends StoreConfig {
  devTools?: boolean | DevToolsOptions;
  autoActions?: boolean;
}

function createApp(config: AppConfig): object;
```

### 参数

- config：`Record<string, any>`
  - StoreConfig：同 [`createStore`](./create-store.md) 的参数。
  - devTools：默认值为true。是否开启 Redux DevTools，当为对象类型时，支持配置 Redux DevTools 的 [Options](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md)。
  - autoActins：默认值为true。是否[自动生成 Actions](./auto-actions.md)。

### 返回值

Reduck App，有以下属性组成：

- Provider：为应用局部的组件树注入共享 Store 的组件。用法同 [`Provider`](./Provider.md)。
- useModel：获取应用局部 Store 挂载的 Model 对象。用法同 [`useModel`](./use-model.md)。
- useStaticModel：获取应用局部 Store 挂载的 Model 对象。用法同 [`useStaticModel`](./use-static-model.md)。
- useLocalModel：获取应用局部 Store 挂载的 Model 对象。用法同 [`useLocalModel`](./use-local-model.md)。
- useStore：获取应用局部使用的 Store 对象。用法同 [`useStore`](./use-store.md)。

## 示例

通过 `createApp` 可以创建局部状态，将不同 Reduck 应用间的状态隔离。

```tsx
const { Provider: LocalFooProvider, useModel: useLocalFooModel } = createApp();
const { Provider: LocalBarProvider, useModel: useLocalBarModel } = createApp();

function Foo() {
  const [fooState] = useLocalFooModel(fooModel);
  const [barState] = useLocalBarModel(fooModel);

  return (
    <div>
      <div>Foo: {fooState}</div>
      <div>Bar: {barState}</div>
    </div>
  );
}

function Container() {
  return (
    <LocalFooProvider>
      <LocalBarProvider>
        <Foo />
      </LocalBarProvider>
    </LocalFooProvider>
  );
}
```
