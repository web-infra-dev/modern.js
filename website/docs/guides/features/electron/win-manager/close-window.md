---
sidebar_position: 3
---

# 关闭窗口

:::info 补充信息
以下示例中，窗口均采用：[**关闭 Node**](/docs/guides/features/electron/develop#窗口中关闭-node推荐)方式进行开发。
:::


## 直接关闭窗口
我们有窗口管理服务，因此可以直接使用 `winService` 来关闭窗口。

```ts
// 渲染进程中
import bridge from '@modern-js/runtime/electron-bridge';

...
// 关闭当前窗口
bridge.winService.closeCurrentWindow();

// 关闭指定窗口
bridge.winService.closeWindowByName('demo');
```

## 关闭时二次确认
有时候，在我们关闭窗口前，期望让用户确认，我们可以这样即可：

- 窗口配置。

  比如在 `demo` 的窗口配置中增加：

  ```ts
  export const windowsConfig: WindowConfig[] = [
    {
      name: 'demo',
      addBeforeCloseListener: true
      ...
    },
  ]
  ```
  :::tip 提示
  这主要是在主进程中，窗口打开时候注册相关监听，便于渲染进程 `registerBeforeClose` 触发。
  :::

- 注册确认回调。

  ```ts
  // 渲染进程中
  const onBeforeCloseListener = bridge.winService.registerBeforeClose(() => {
      return true;
    });

  // 解除监听
  onBeforeCloseListener.dispose();
  ```
  :::tip 提示
  - 上述 `registerBeforeClose` 回调中，返回 `true` 表示继续关闭，`false` 表示阻止关闭。
  - 回调可以是异步的。
  :::

- 忽略所有回调，直接关闭窗口。
  当我们期望强制关闭窗口，忽略关闭确认弹窗时候，我们可以在关闭的时候传参数，比如：

  ```ts
  // 渲染进程中
  import bridge from '@modern-js/runtime/electron-bridge';

  ...
  // 关闭当前窗口
  bridge.winService.closeCurrentWindow({
      closeMode: 'close'
    });

  // 关闭指定窗口
  bridge.winService.closeWindowByName('demo', {
    closeMode: 'close'
  });
  ```
  这将忽略 `registerBeforeClose` 回调，直接关闭窗口。

## 关闭时的回调函数
有时候，我们期望在窗口关闭之前做一些工作。比如：保存一些数据，此时，我们可以这样做。

- 窗口配置。

  比如在 demo 的窗口配置中增加：

  ```ts
  export const windowsConfig: WindowConfig[] = [
    {
      name: 'demo',
      addBeforeCloseListener: true
      ...
    },
  ]
  ```

- 渲染进程注册回调。
  ```ts
  // 渲染进程中
  const onWillCloseListener = bridge.winService.registerWillClose(() => {
      console.log('do something before close');
    });

  // 解除监听
  onWillCloseListener.dispose();
  ```

  :::info 补充信息
  - 回调可以是异步的。
  :::
