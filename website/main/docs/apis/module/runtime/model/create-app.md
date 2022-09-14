---
sidebar_position: 5
---

# createApp

:::info 补充信息
用于创建局部状态，将不同 **Model App** 间状态隔离。
```ts
import { createApp } from '@modern-js/runtime/model';
```
:::

:::caution 注意
- 注意 `@modern-js/runtime/model` 中导出的 `createApp` 用于管理状态，而 `@modern-js/runtime` 导出的 `createApp` 用于管理更下层的运行时，两者功能不同。
:::

## API

`createApp(config) => object`
### 参数

- config：`Record<string, any>`
  - [models]：在 App 入口中统一注册 models。（正常使用无需提前注册）
  <!-- TODO: 注册有什么用？ -->
  - [initialState]：用于设置全局 store 的初始状态。（一般用于 SSR，初始化数据）
  - [plugins]：注入插件，可注入的插件有（router、immer、auto-action、machine  等）。
  <!-- TODO: 插件列表、链接 -->
  - [enhancers]：Redux createStore API enhancer 配置，详见[介绍](https://redux.js.org/api/createstore)。

### 返回值

- Provider：`React.ComponentType<any>`，React 组件，提供局部 **React Context** 环境。
- useModel：`function`，获取 **Model** 的 **React Hook** 函数，详见 [**useModel**](../container/use-model.md)。
- useStaticModel：`function`，获取 **Model** 的 **React Hook** 函数，详见 [**useStaticModel**](../container/use-static-model.md)。

## 示例

通过 `createApp` 可以创建局部状态，将不同 **Model App** 间状态隔离。

```tsx
import { createApp, model } from '@modern-js/runtime/model';
import autoActions from '@modern-js-reduck/plugin-auto-actions';
import { fooModel } from '@/common/models';

const { Provider: LocalFooProvider, useModel: useLocalFooModel} = createApp({
  plugins: [autoActions()]
});
const { Provider: LocalBarProvider, useModel: useLocalBarModel} = createApp({
  plugins: [autoActions()]
});

function Foo() {
  const [fooState] = useLocalFooModel(fooModel);
  const [barState] = useLocalBarModel(fooModel);

  return <div>
    <div>Foo: {fooState}</div>
    <div>Bar: {barState}</div>
  </div>
}

function Container() {
  return <LocalFooProvider>
    <LocalBarProvider>
      <Foo />
    </LocalBarProvider>
  </LocalFooProvider>
}
```
