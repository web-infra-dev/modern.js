---
sidebar_position: 2
---

# exposeInMainWorld

:::info 补充信息
* 使用进程：[渲染进程（webview）](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { exposeInMainWorld } from '@modern-js/runtime/electron-webview';
```
:::

`exposeInMainWorld(apis)`

#### 参数
- apis：`{ [key: string]: unknown }`，需要在预加载脚本中注册给渲染进程使用的 `apis`。
#### 返回值
- `void`。

通过 Electron 官方提供的原生 API: `exposeInMainWorld(key, apis)` 进行注册 `apis`。最终在前端中可以入下方式获得对应服务：

```ts
window[key].xxx
```
在 Modern Electron 中，我们进行了一层简易封装，支持类型提示。我们可以通过如下方式获得 API：

```ts title="xxx/xxx.tsx"
import { webviewBridge } from '@modern-js/runtime/electron-bridge';

...
webviewBridge.xxx
```

## 示例

```ts title="electron/preload/webview/index.ts"
import {
  exposeInMainWorld,
  webviewPreloadApis,
} from '@modern-js/runtime/electron-webview';

export const apis = {
  ...webviewPreloadApis,
};

exposeInMainWorld(apis);
```

:::info 补充信息
从 `@modern-js/runtime/electron-webview` 引入的 `exposeInMainWorld` 相当于是：
```ts
import { exposeInMainWorld } from 'electron';

exposeInMainWorld('webviewBridge', apis);
```
:::

:::info 补充信息
- [关于 `webviewPreloadApis`](/docs/apis/runtime/electron/webview-process/webview-preload-apis)。
:::
