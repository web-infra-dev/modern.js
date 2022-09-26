---
sidebar_position: 5
---

# WindowConfig

:::info 补充信息
* 使用进程：[主进程](/docs/guides/features/electron/basic#主进程)。

```ts
import type { WindowConfig } from '@modern-js/runtime/electron-main';
```

:::
我们在框架里，提供了窗口管理的能力。因此，对于每个窗口的配置，也有做相应管理。每个窗口配置具体如下：

WindowConfig
- name：`string`，窗口名。（窗口名需要唯一。）

- [loadUrl]：`string`，窗口加载路径，默认加载与窗口同名的入口，入口名为 `main` 则默认加载：`http://localhost:8080`。

- [multiple]：`boolean`，是否允许此窗口打开多个，默认为 `false`。
- [options]：[`BrowserWindowConstructorOptions`](https://www.electronjs.org/zh/docs/latest/api/browser-window#new-browserwindowoptions)，窗口基础配置，默认为：
  ```ts
  {
    width: 1024,
    height: 800,
    show: true,
  }
  ```

- [disableAutoLoad]：`boolean`，是否允许默认加载路径。若开启，则在打开窗口后不加载任何路径，可自行按需加载，默认为 `false`。

- [useFileProtocolInDev]：`boolean`，是否在开发环境下，使用 `file` 协议加载路径，默认为：`false`。

- [hideWhenClose]：`boolean`，窗口关闭时，是否使用隐藏来代替关闭，默认为：`false`。

- [addBeforeCloseListener]：`boolean`，窗口关闭时，当需要注册关闭前回调时。比如：`registerWillClose` 或 `registerBeforeClose`，需要配置此属性，注册关闭监听，默认为：`false`。
