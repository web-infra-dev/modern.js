---
sidebar_position: 3
title: useStaticModel
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

如果想在组件里以 React Hook 的形式消费某个 Model，并能随时获取到当前最新的状态，但又不希望 Model 状态更新的时候，引起组件的重新渲染，可以使用 `useStaticModel`。`useStaticModel` API 形式上与 `useModel` 完全一致。具体使用请参考 [`useModel`](./use-model.md)。

为了保证总是能获取到最新状态，注意不要对返回的 `state` 解构。

```tsx
function App() {
  // ❌ 不能解构 state，但可以解构 actions。
  const [{ username }, { logout }] = useStaticModel(userModel);

  // ✅ 这才是正确使用姿势。
  const [state, { logout }] = useStaticModel(userModel);

  useEffect(() => {
    state.username;
  }, []);
}
```

#### 示例

如下 `App` 组件消费了 `userModel` 的状态，但没有直接在 JSX 里使用。如果 `userModel` 状态的改变会引起组件重新渲染，这是没有必要的，这种情况可以使用 `useStaticModel` 进行优化。

```tsx
function App() {
  const [state] = useStaticModel(userModel);

  useEffect(() => {
    // 统计 UV 数据
    send('pageview', { user: state.user });
  }, [state]);

  return <div>Hello</div>;
}
```

:::info 更多参考
[使用 Model](/docs/guides/features/model/use-model)
:::
