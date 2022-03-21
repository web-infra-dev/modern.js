---
sidebar_position: 1
---

# browserWindowPreloadApis

:::info 补充信息
* 使用进程：[渲染进程（webview）](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { webviewPreloadApis } from '@modern-js/runtime/electron-webview';
```
:::


`webviewPreloadApis`

是框架所有 api 的一个集合，用于在窗口中[**关闭 Node**](/docs/guides/features/electron/develop)后框架服务的注册与使用，具体包含 api 如下。

- [`registerServices`](/docs/apis/runtime/electron/webview-process/index_#registerservices)
- [`whenConnected`](/docs/apis/runtime/electron/webview-process/index_#whenConnected)
- [`onMessage`](/docs/apis/runtime/electron/webview-process/index_#onMessage)
- [`callBrowserWindow`](/docs/apis/runtime/electron/webview-process/index_#callbrowserwindow)
- [`send`](/docs/apis/runtime/electron/webview-process/index_#send)
