---
sidebar_position: 3
---

# 渲染进程注册服务
在渲染进程中，注册的服务，一般有如下两种场景：
- 注册服务，供主进程访问。
- 注册服务，供渲染进程（webview）访问。

两者注册的服务内容不一样，面向的访问对象也不一样。

## 注册服务，供主进程访问
这种场景下，我们通过 `winService` 进行注册服务。

### 实现服务内容

```ts title='services/index.ts'
export const getPageLocation = () => {
  return window.location.href;
}
```

### 注册服务

```ts title="xx/xx.tsx（渲染进程）"
// 渲染进程中
import { winService } from '@modern-js/runtime/electron-render';
import * as services from './services';
...
winService.registerServices(services);
```

### 主进程中访问服务

```ts title="electron/services/index.ts（主进程）"
// 主进程中

import { winService } from '@modern-js/runtime/electron-main';

export const getPageLocationOfMainWindow = () => {
  return winService.callBrowserWindow('getPageLocation');
}
```

## 注册服务，供渲染进程（webview）访问
这种场景下，我们通过 `webviewService` 进行注册服务。

### 实现服务内容

```ts title='services/index.ts'
export const getWindowName = () => {
  return 'main';
}
```

### 注册服务

```ts title="xx/xx.tsx（渲染进程）"
// 渲染进程中
import { webviewService } from '@modern-js/runtime/electron-render';
import * as services from './services';
...
webviewService.registerServices(services);
```

### webview 进程中访问服务

```ts title="xx/xx.tsx（webview 进程）"
// webview 进程中

import webviewBridge from '@modern-js/runtime/electron-webview';
...

webviewBridge.callBrowserWindow('getWindowName');
```
