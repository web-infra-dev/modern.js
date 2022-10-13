---
sidebar_position: 4
---

# webview 注册服务

在 webview 中注册服务主要是给父窗口进行访问和使用的。

## 注册服务

- 定义服务

```ts title='electron/services/index.ts（主进程）'
export const getCurrentPageLocation = () => {
  return window.location.href;
};
```
- 注册服务

```ts title="xx/xx.tsx（webview 进程）"
import webviewBridge from '@modern-js/runtime/electron-webview';
import * as services from './services';
webviewBridge.registerServices(services);
```

## 渲染进程中访问
首先，为了能和 webview 做通信和管理，我们首先要将 webview 管理起来。
### 管理 webview

我们给每一个 webview 标签都添加一个唯一的 ID。如下示例，增加：`id="webview1"`：

```ts title="xx/xx.tsx（渲染进程）"
<webview
  src={
    "https://www.baidu.com"
  }
  id="webview1"
  nodeintegration="true"
>
```

给 webview 注册到`webviewService`中，便于通信。
```ts title="xx/xx.tsx（渲染进程）"
// 渲染进程中
import { webviewService } from '@modern-js/runtime/electron-render';
...

webviewService.addWebview('webview1');
```

:::tip 提示
- 参数即为 webview ID。
:::

### 访问 webview 的服务

```ts title="xx/xx.tsx（渲染进程）"
// 渲染进程中
import { webviewService } from '@modern-js/runtime/electron-render';
...
// 访问 webview1 的服务 getCurrentPageLocation
webviewService.callWebview('webview1', 'getCurrentPageLocation');
```
:::tip 提示
只有被 `webviewService.addWebview` 的 webview 服务才可以调用。
:::
