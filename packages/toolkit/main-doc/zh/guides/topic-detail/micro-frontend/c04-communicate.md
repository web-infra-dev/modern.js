---
sidebar_position: 4
title: 主子应用通信
---

## props 通信

Modern.js 中，会将子应用包裹成一个 React 组件，直接通过给 React 组件传递 `props` 即可实现主应用和子应用通信的目的。

```tsx title=主应用：App.tsx
function App() {
  const { MApp } = useModuleApps();

  return <div>
    <MApp count={100} />
  </div>;
}
```

```tsx title=子应用：App.tsx
function App(props) {
  console.log(props);
  return ...
}
```

子应用将会打印 `{count: 0}`，目前尚未支持子应用渲染响应式，及时在主应用上更改 `count` 的数据也不会触发视图更新

## channel 通信

[Garfish.channel](https://www.garfishjs.org/api/channel) 用于应用间的通信。它是 `EventEmitter2` 的实例

```ts
// 子应用监听登录事件
const App = () => {
  const handleLogin = (userInfo) => {
    console.log(`${userInfo.name} has login`);
  };

  useEffect(() => {
    window?.Garfish.channel.on('login', handleLogin);
    return () => {
      window?.Garfish.channel.removeListener('login', handleLogin);
    };
  });
};

// 主应用触发监听事件
api.getLoginInfo.then((res) => {
  if (res.code === 0) {
    window.Garfish.channel.emit('login', res.data);
  }
});
```
