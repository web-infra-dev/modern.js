---
sidebar_position: 9
---

# getStore

:::info 补充信息
默认情况下，本节所有 API 的导出包名为：`@modern-js/runtime/model`。

如果是在 Modern.js 以外单独集成 Reduck，导出包名为：`@modern-js-reduck/react`。
:::

`getStore` 用于获取当前组件树共享的 Store。常用于在组件外访问 Model 的场景。注意，调用 `getStore` 时，需要保证组件树已完成挂载，否则无法获取到 Store。


## 类型

```ts
function getStore(): ReduckStore
```

## 返回值

- ReduckStore：Reduck Store，类型参考 [createStore](./create-store.md) 返回值。

## 示例

```ts
// 保证 getStore 在组件树挂载完成后执行
setTimeout(()=>{
  const store = getStore();
  const [, actions] = store.use(countModel);
  setInterval(()=>{
    actions.add();
  }, 1000)
}, 1000)

function Counter() {
  const [state] = useModel(countModel);

  return (
    <div>
      <div>counter: {state.value}</div>
    </div>
  );
}
```

:::info 更多参考
[使用 Model](/docs/guides/features/model/use-model)
:::
