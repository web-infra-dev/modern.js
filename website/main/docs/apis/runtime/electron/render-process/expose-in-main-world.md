---
sidebar_position: 2
---

# exposeInMainWorld

:::info 补充信息
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { exposeInMainWorld } from '@modern-js/runtime/electron-render';
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
import bridge from '@modern-js/runtime/electron-bridge';

...
bridge.xxx
```

## 示例

```ts title="electron/preload/index.ts"
import {
  exposeInMainWorld,
  browserWindowPreloadApis,
} from '@modern-js/runtime/electron-render';

const { callMain } = browserWindowPreloadApis;

export const apis = {
  ...browserWindowPreloadApis,
  openInBrowser: (url: string) => {
    return callMain('openInBrowser', url);
  },
};

exposeInMainWorld(apis);
```

:::info 补充信息
- [关于 `browserWindowPreloadApis`](/docs/apis/runtime/electron/render-process/browser-window-preload-apis)。
- [完整示例](/docs/guides/features/electron/develop)。
:::
