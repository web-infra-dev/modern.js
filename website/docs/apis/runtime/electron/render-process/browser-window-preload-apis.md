---
sidebar_position: 1
---

# browserWindowPreloadApis

:::info 补充信息
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { browserWindowPreloadApis } from '@modern-js/runtime/electron-render';
```
:::

`browserWindowPreloadApis`

是框架所有 api 的一个集合，用于在窗口中【[**关闭 Node**](/docs/guides/features/electron/develop)】后框架服务的注册与使用，具体包含 api 如下。
- [`callMain`](/docs/apis/runtime/electron/render-process/call-main)
- [`winService`](/docs/apis/runtime/electron/render-process/win-service)
- [`lifecycleService`](/docs/apis/runtime/electron/render-process/lifecycle-service)
- [`updateService`](/docs/apis/runtime/electron/render-process/update-service)
- [`webviewService`](/docs/apis/runtime/electron/render-process/webview-service)
- isElectron：`boolean`，可用于在前端中判断是否处于 Electron 环境。

:::tip 提示
从 `@modern-js/runtime/electron-webview` 引入的 `exposeInMainWorld` 相当于是：
```ts
import { exposeInMainWorld } from 'electron';

exposeInMainWorld('bridge', apis);
```
:::
