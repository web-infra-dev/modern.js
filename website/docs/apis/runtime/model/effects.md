---
sidebar_position: 4
---

# effects

:::info 补充信息
**effects** 用于封装各种副作用函数。
:::

:::tip 提示
- `@modern-js-reduck/plugin-effects` 内置于 Modern.js，默认开启。
- 可通过 [**modern.config.js**](#) 关闭插件。
:::

[**actions**](./model_#actions) 是用来同步修改 **state** 的（纯函数、无副作用）。但应用开发的过程中，会有大量的**异步请求或者封装某些操作**等各种副作用的调用，所以这里将各种副作用的函数（**Effect Handler**）封装在 **effects** 模块。

## 示例

**Effect Handler** 函数类型包括 3 种：

- [**VoidEffect**](#voideffect)：返回类型为 **void**。
- [**PromiseEffect**](#promiseeffect)：**async/await** (Promise) 类型。
- [**ThunkEffect**](#thunkeffect)：**redux-thunk** 中间件支持的 **thunk** 类型。

```ts title="类型签名"
type VoidEffect = (...args: any[]) => void;
type PromiseEffect = (...args: any[]) => Promise<any>;
type ThunkEffect = (...args: any[]) => (dispatch?, getState?) => void | Promise<any>;

interface ModelEffects {
  [effectKey: string]: VoidEffect | PromiseEffect | ThunkEffect,
}
```


### VoidEffect
副作用调用并不只是异步请求，比如还有 localStorage、DOM 操作等，这些操作没有返回，那么也无需进行 pending、fulfilled、rejected 等阶段的处理。

对于不需要进行 pending、fulfilled、rejected 等阶段处理的异步请求也可以选择不 return。

```tsx title="示例"
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define((_, { use }) => {
  return {
    state: {
      value: 'foo'
    },
    effects: {
      async load() {
        const resp = await fetch('xxxx');
        const [, actions] = use(fooModel);
        actions.setValue(resp.data);
      },
      setLocalStorage(key: string, value: string) {
        localStorage.set(key, value);
      }
    }
  }
});

function App() {
  const [, actions] = useModel(fooModel);

  return <button type="button" onClick={async () => {
    await actions.load();
    actions.setLocalStorage();
  }}>go</button>
}
```


### PromiseEffect
一个异步请求完成前后通常有三种状态 pending（请求中）、fulfilled（请求成功）、rejected（请求失败）。

所以当触发一个 **effect dispatcher** 时，其内部就会在请求的不同阶段自行调用 `actions.load.pending`（请求中）、`actions.load.fulfilled`（请求成功调用）、`actions.load.rejected`（请求失败调用）这几个 **action dispatcher**。

所以为了正常处理这这三个状态对应的结果，我们需要编写相应 **pending、fulfilled、rejected** 阶段的 **action handler**。在相应的 **action handler** 函数中处理副作用函数所触发的不同阶段。

```tsx title="示例"
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define((_, { use }) => {
  return {
    state: {
      items: [{
        text: 'Use Reduck',
        completed: false
      }],
      isPending: false,
      error: null
    },
    actions: {
      load: {
        pending(state) {
          state.isPending = true;
          state.error = null;
        },
        fulfilled(state, payload: Array<{ text: string; completed: boolean }>) {
          state.items = payload;
          state.isPending = false;
        },
        rejected(state, error: any) {
          state.error = error;
          state.isPending = false;
        }
      }
    },
    effects: {
      async load() {
        return await [
          { text: 'foo', completed: false},
          { text: 'bar', completed: true }
        ]
      },
    }
  }
});

function App() {
  const [, actions] = useModel(fooModel);

  return <button type="button" onClick={async () => {
    await actions.load();
    actions.setLocalStorage();
  }}>go</button>
}

```

### ThunkEffect
**redux-thunk** 中间件也是为了解决异步函数诞生的。所以这里也支持了 Thunk 类型函数

:::tip 提示
支持返回值为 `Promise<any>`，当返回值为 Promise 时，效果等同于 PromiseEffect，也会主动调用各个状态的 action dispatcher，这样无需手动调用了。
:::

```tsx title="示例"
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define((_, { use }) => {
  return {
    state: {
      value: 'foo'
    },
    effects: {
      loadThunk: (...args) => (dispatch, getState) => {
        dispatch.todo.load.pending()
        /* 等价于
          dispatch({
            type: 'TODO/LOAD/PENDING'
          })
        */

        fetch('xxxx')
          .then(data => context.actions.load.fulfilled(data))
          .catch(err => context.actions.load.rejected(err))
      }
    }
  }
});

function App() {
  const [, actions] = useModel(fooModel);

  return <button type="button" onClick={() => {
    actions.load();
  }}>go</button>
}
```
