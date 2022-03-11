---
sidebar_position: 1
---

# model

:::info 补充信息
用于创建管理数据流的 Model。
```ts
import { model } from '@modern-js/runtime/model';
```
:::

:::tip 提示
- **Reduck** 是 **React** 应用状态管理库，可以称其为 **React** 应用框架（MVC）。

- 其目标是以 **MVC** 模式组织 **React** 应用开发结构，将业务逻辑维护在 **Model** 层，业务逻辑与 **UI** 解耦，开发业务逻辑更集中、更简单，并减少重复工作（样板代码）。

- 基于 **MVC** 模式，规范一个 **React** 应用开发的架构，**M**（Model） 指 Reduck Model，**V**（View） 指 React UI Component，**C**（View Controller/Container）指 React Container Component。

- 可通过 [**modern.config.js**](#) 关闭。
:::

[**Reduck**](https://github.com/modern-js-dev/reduck) 管理数据流屏蔽了一些 **Redux** 复杂的概念，API 简单易用，同时又完全兼容 **Redux** 写法（方便迁移），以及 **Redux** 丰富的生态。

前端的技术选型里，除了考虑上手成本、生态等因素之外，性能也是一个很重要的衡量因素。**Reduck** 自身基于社区实践做了不少的性能优化处理，同时在使用的时候，合理有效的API传参，也会使性能得到极大的提升。

原始类型较为复杂，下面展示的是简化名称、泛型后的等价函数类型。原始类型见 [**model**](https://github.com/modern-js-dev/reduck/blob/main/packages/store/src/model/model.ts#:~:text=const-,model,-%3D%20%3CState%20%3D%20any%2C%20MDO)。

## API

`model(name) => { define: function }`

### 参数

- name：`string`，创建的 Model 的唯一标识。

### 返回值

<!-- TODO: @anchao 调整类型 -->
```ts
interface NamedModel {
  define(modelDesc: Record<string, any>): Model;
  define((context: Context, utils: Utils) => Record<string, any>): Model;
}

interface Utils {
  use: UseModel;
  onMount: OnMountHook;
}

interface Context {
  store: ReduxStore;
  pluginCore: ReturnType<typeof createPluginCore>;
  apis: {
    addReducers: (reducers: Record<string, Reducer>) => void;
    addModel: <M extends Model>(model: M, mountModel: MountedModel<M>) => void;
    getModel: <M extends Model>(model: M) => MountedModel<M> | null;
    useModel: ReturnType<typeof createUseModel>;
    getModelSubscribe: (model: Model) => ReturnType<typeof createSubscribe>;
    /**
     * Get mountedModel instance by modelname
     */
    getModelByName: (name: string) => MountedModel | null;
    /**
     * Tag that model with name is `param name` is in mounting.
     */
    mountingModel: (modelname: string) => void;
  }
}
```

## 示例

### 通过对象创建 **Model**

```tsx title="示例"
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define({
  state: 'foo'
});

function App() {
  const [state, actions] = useModel(fooModel);

  // "foo"
  return <div>state: {state}</div>
}
```


### 通过函数创建 **Model**
通过函数创建，可以在其中拿到 **ReduckStore** 及相关工具函数。
如通过 **use**，可以获取 **model** 自身及其它 **model** 的 **state**，**actions**。

```tsx title="示例"
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define(() => {
  return {
    state: 'foo'
  }
});

const barModel = model('bar').define((_, { use }) => {
  return {
    state: 'bar',
    effects: {
      syncFoo() {
        const [state, actions] = use(fooModel);

        actions.setState(state);
      }
    }
  }
});

function App() {
  const [state, actions] = store.use(barModel);

  useEffect(() => {
    actions.syncFoo();
  }, []);

  // "foo"
  return <div>state: {state}</div>
}
```
