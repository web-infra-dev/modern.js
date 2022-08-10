---
sidebar_position: 3
---

# actions

:::info 补充信息
**actions** 用于修改 **state**，相当于 **Redux** 的 **reducers**。
:::

## 示例

```ts
import { model, useModel } from '@modern-js/runtime/model';

const fooModel = model('foo').define(() => {
  return {
    state: {
      a: 'a',
      b: 'b'
    },
    actions: {
      setA(state, a: string) {
        // 启用 immer 插件时
        state.a = a;

        // 未启用 immer 插件时
        return {
          ...state,
          a
        }
      }
    }
  }
});

function App() {
  const [state, actions] = useModel(fooModel);

  useEffect(() => {
    actions.setA('newA');
  }, []);

  // "newA"
  return <div>state: {state.a}</div>
}
```
**actions** 部分定义的函数应为纯函数，每次计算都应返回 **immutable data**，在该函数中同步修改 **state**。

但上述例子配合 **@modern-js-reduck/plugin-immer** 插件，可以简单地用操作 **mutable data** 的方式来编写，省去了繁琐的编码。
