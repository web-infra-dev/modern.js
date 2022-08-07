---
sidebar_position: 2
---

# useStaticModel

:::info 补充信息
如果想在组件里以 **React Hook** 的形式消费某个 **Model**，并能随时获取到当前最新的状态，但又不希望 **Model** 状态更新的时候，引起组件的 rerender，可以使用 `useStaticModel`。
```ts
import { useStaticModel } from '@modern-js/runtime/model';
```
:::

## API
`useStaticModel` API 形式上与 `useModel` 完全一致。具体使用请参考 [`useModel`](./use-model.md)。

为了保证总是能获取到最新状态，注意不要对返回的 `state` 结构，`state` 上挂载了 `get` 方法，通过 `state` 才能拿到最新的值。

```tsx
function App() {
  // ❌ 不能解构 state，但可以解构 actions。
  const [{ username }, { logout }] = useStaticModel(userModel);

  // ✅ 这才是正确使用姿势。
  const [state, { logout }] = useStaticModel(userModel);

  useEffect(() => {
    state.username
  }, []);
}
```

## 示例

### 在性能敏感场景使用

如 [`react-three-fiber`](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls#never-bind-fast-state-reactive) 建议不要在动画组件 UI 里绑定会快速变化的状态，否则会引起严重的性能问题。这种情况就可以选择使用 `useStaticModel`，因为它只会订阅状态，但绝不会引起视图的 rerender。

```tsx
function ThreeComponent() {
  const [state, actions] = useStaticModel(modelA);

  useFrame(() => {
    state.value // 假设初始化为 0
    actions.setValue(1);
    state.value // 这里会得到1
  });
}
```

### 闭包函数消费
在编写组件的时候，消费 **Model** 获得的数据主要有两个用途，一是直接供视图消费，二是供组件内的一些闭包函数消费。

```tsx
function App() {
  const [state] = useModel(userModel);

  useEffect(() => {
    send('pageview', {user: state.user});
  }, [state])

  return <div>Hello</div>;
}
```

如上 `App` 组件消费了 `userModel` 的状态，但没有直接在 View 里使用，但 `userModel` 状态的改变却会引起 View 的 rerender，这是不符合预期的，这种情况可以使用 `useStaticModel` 进行优化。

```tsx
function App() {
  const [state] = useStaticModel(userModel);

  useEffect(() => {
    send('pageview', {user: state.user});
  }, [state])

  return <div>Hello</div>;
}
```
