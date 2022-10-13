---
sidebar_position: 3
title: 主子应用通信
---

## props 通信

Modern.js 中，会将子应用包裹成一个 React 组件，直接通过给 React 组件传递 `props` 即可实现主应用和子应用通信的目的。

```tsx title=主应用：App.tsx
function App() {
  const { Dashboard } = useModuleApps();
  const [count, setCount] = useState(0);

  return <div>
    <Dashboard count={count} />
    <button onClick={() => setCount(count + 1)}>add</button>
  </div>;
}
```

```tsx title=子应用：App.tsx
function App(props) {
  console.log(props);

  return ...
}
```

子应用将会打印 `{count: 0}`。

当主应用点击 `add` 按钮，`count` 状态更新的时候，子应用也会响应到最新的 `props` 数据，并重新渲染。

## 使用 Model 通信


:::tip 提示
近期上线，敬请期待。
:::
