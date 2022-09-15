---
sidebar_position: 3
---


# webviewBridge

:::info 补充信息
* webview 通信管理。
* 使用进程：[渲染进程（webview）](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { webviewBridge } from '@modern-js/runtime/electron-bridge';
```
:::
## 实例方法


### registerServices

`webviewBridge.registerServices(services)`

#### 参数
- services：`{ [key: string]: unknown }`，需要注册的服务集合。
#### 返回值
- `void`。

```ts
registerServices(services: { [key: string]: unknown }): void;
```
注册服务，提供给 webview 父窗口访问。

### whenConnected

`webviewBridge.whenConnected()`

#### 返回值
- `Promise<boolean>`，通信是否已建立。

当与窗口建立了连接。

### onMessage

`webviewBridge.onMessage<T>(channel)`
#### 参数
- T 消息的类型。
- channel：`string`，频道名。

#### 返回值
- `Event<T>`，返回仅监听 `channel` 频道的事件监听器。

返回仅监听 `channel` 频道的事件监听器。

:::tip 提示
监听 webview 父窗口的除了广播消息以外的消息，比如：`webviewService.send`。
:::

### callBrowserWindow

`webviewBridge.callBrowserWindow(funcName[,...args])`

#### 返参数
- funcName：`string`，访问父窗口函数服务名。
- [args]：`any[]`，访问父窗口函数服务参数。

#### 返回值
- `Promise<any>`，访问父窗口函数服务结果。

访问 webview 父窗口注册给 webview 访问的相关服务。

### send

`webviewBridge.send(channel[,...args])`

#### 参数
- channel：`string`，通信频道名。
- [args]：`any[]`，通信参数。

```ts
send(channel: string, data?: any): void;
```
发送消息给 webview 父窗口。


### 示例

在 webview 预加载脚本中：

```ts
import { webviewBridge } from '@modern-js/runtime/electron-bridge';

// 接收 browserWindow 的消息
const onWindowMsg = webviewBridge.onMessage<{a: string}>('demo-to-webview');
const msgListener = onWindowMsg((msg) => {
  console.log('msg from demo window:', msg);
})



// 发送消息给窗口
webviewBridge.send('demo-webview', {
  msg: 'this is msg from demo webview'
})

// 访问窗口 webviewService
webviewBridge.callBrowserWindow('webviewService', 'demo-webview', 'demo')
.then((res) => {
  console.log('msg from demo webviewService exec result:', res);
})

// 在 unload 时候解除所有监听
const unloadHandler = () => {
  msgListener.dispose();
  window.removeEventListener('unload', unloadHandler);
};
window.addEventListener('unload', unloadHandler);
```




