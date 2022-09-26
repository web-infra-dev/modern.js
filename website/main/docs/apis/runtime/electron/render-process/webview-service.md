---
sidebar_position: 5
---

# webviewService

:::info 补充信息
* webview 管理服务。
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { webviewService } from '@modern-js/runtime/electron-render';
```
:::

## 实例方法

### addWebview

`webviewService.addWebview(webviewId[,withIpcServer])`
#### 参数
- webviewId：`string`。
- [withIpcServer]：`boolean`，是否创建与此 webview 的通信服务，默认为 `true`。

#### 返回值
- `objct | undefined`，如果建立通信服务，则返回通信服务对象。

通过 webviewService 进行 webview 管理和通信时，需先将 webview 加入进来。

:::info 补充信息
- 一般，我们会在 webview dom-ready 的时候执行此方法
- withIpcServer 默认为 true，我们会为每一个 webview 启动一个 ipcService 用于窗口和 webview 直接的双向通信。
:::

### setTimeoutDelay

`webviewService.setTimeoutDelay(timeout)`
#### 参数
- timeout：`number`，超时时间。

#### 返回值
- `void`。

webview 还未与父窗口建立连接之前，会缓存 webview 的消息，会在 webview 连接后，将消息发送给 webview。
此方法则是设置缓存等待时间，超过时间，则消息作废。

### callWebview

`webviewService.callWebview(webviewId,funcName[,...args])`
#### 参数
- webviewId：`string`。
- funcName：`string`，执行父窗口服务函数名。
- [args]：`any[]`，执行父窗口服务函数参数。
#### 返回值
- `Promise<any>`，执行结果。


让 ID 为 webviewId 的 webview 执行函数 `funcName`，并返回执行结果。

### dispose

`webviewService.dispose()`

#### 返回值
- `void`。

关闭通信连接，关闭通信服务端。

### getWebviewById

`webviewService.getWebviewById(webviewId)`
#### 参数
- webviewId：`string`。

#### 返回值
- `Electron.WebviewTag | null`。

根据 webviewId 获得 webview 元素。

### registerServices

`webviewService.registerServices(services)`
#### 参数
- services：`{ [key: string]: unknown }`，需要注册的服务。
#### 返回值
- `void`。

注册服务，给 webview 调用。比如：webviewBridge.callBrowserWindow('xxx', 'xx')。

:::warning 警告
此方法仅可调用一次
:::

### removeWebviewIpcServer

`webviewService.removeWebviewIpcServer(webviewId)`
#### 参数
- webviewId：`string`。
#### 返回值
- `void`。

取消某个 webview 的通信服务。

### getWebviewIds

`webviewService.getWebviewIds()`
#### 返回值
- `number[]`，返回所有 webview 的 ID。

获取所有 webview 的 **webcontentsId**。

### onMessage

`webviewService.onMessage(webviewId, channel)`
#### 参数
- webviewId：`string`，被监听消息的 webview 的 ID。
- channel：`string`，频道名。
#### 返回值
- `object`，返回仅监听 channel 频道的事件监听器。


返回仅监听 webview id 为 `webviewId`， 事件频道为 `channel` 的监听器。

### sendToWebview

`webviewService.sendToWebview(webviewId, channel[,data])`
#### 参数
- webviewId：`string`。
- channel：`string`，频道名。
- [data]：`any`，消息参数。
#### 返回值
- `void`。


根据 webviewId （用户定义的 ID） 在 channel 的频道给 webview 发消息。

### broadCast

`webviewService.broadCast(channel[,data])`
#### 参数
- channel： `string`，频道名。
- [data]：`any`，消息参数。
#### 返回值
- `void`。

给此窗口所有 webview 在 `channel` 上广播消息。


### 示例

在渲染进程中：

```ts

import bridge from '@modern-js/runtime/electron-bridge';

const { webviewService } = bridge;

...

useEffect(() => {
  // 添加对 webviewid1 的管理，并注册通信服务
  webviewService.addWebview('webviewid1', true);

  webviewService.registerServices({
    test: () => {
      console.log('这是注册的一个 test 服务，用于 webviewBridge.callBrowserWindow('test') 执行，并返回执行结果!');
    }
  })

  // 给 webviewid1 在 msg-to-webview 频道发送消息：{a: 1}
  webviewService.sendToWebview('webviewid1', 'msg-to-webview', {a: 1};

  // 监听来自 webviewid1 的消息
  const onWebview1Msg = webviewService.onMessage('webviewid1', 'msg-from-webview');
  const onWebview1MsgListener = onWebview1Msg((msg) => console.log('这是来自 webview id 为 webviewid1，频道为：msg-from-webview 的消息:', msg));
  return () => {
    // 组件卸载，取消监听
    onWebview1MsgListener.dispose();
  }
}, [])
```

