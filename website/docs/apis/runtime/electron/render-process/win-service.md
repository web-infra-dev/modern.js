---
title: winService
sidebar_position: 4
---

:::info 补充信息
* 窗口管理服务。
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { winService } from '@modern-js/runtime/electron-render';
```
:::

## 实例方法

### broadCast

`winService.broadcast(channel[,...args])`

#### 参数
- channel：`string`， 广播频道名。
- [args]：`any[]`，广播参数。
#### 返回值
- `void`。

给所有窗口在 channel 频道上发送消息。

### sendTo

`winService.sendTo(receiver,channel[,...args])`
#### 参数
- receiver：`number | string`，接收窗口 ID 或者窗口名。
- channel：`string`， 通信频道名。
- [args]：`any[]` 访问服务函数的参数。
#### 返回值
- `void`。

根据窗口名字或者 ID 发送消息到 `channel` 频道。


### closeWindowByName

`winService.closeWindowByName(name[,options])`
#### 参数
- name：`string`，窗口名。
- [options]：`object`，关闭模式。
  - [closeMode]：`'close' | 'confirmOrClose'`，当 `closeMode=close` 时，会直接关闭，忽略回调。当 `closeMode=confirmOrClose`，如果有确认回调，会执行确认回调，默认为：`confirmOrClose`。
#### 返回值
- `Promise<boolean>`，是否关闭成功。

根据窗口名关闭窗口。


### closeWindowById

`winService.closeWindowById(id[,options])`
#### 参数
- id：`number`，窗口 ID。
- [options]：`object`，关闭模式。
  - [closeMode]：`'close' | 'confirmOrClose'`，当 `closeMode=close` 时，会直接关闭，忽略回调。当 `closeMode=confirmOrClose`，如果有确认回调，会执行确认回调，默认为：`confirmOrClose`。
#### 默认值
- `Promise<boolean>`，是否关闭成功。

根据窗口 ID 关闭窗口。

### closeCurrentWindow

`winService.closeCurrentWindow()`

#### 返回值
- `Promise<boolean>`，是否关闭成功。

关闭当前窗口。

### callOtherWindow

`winService.callOtherWindow(receiver,funcName[,...args])`

#### 参数
- receiver：`string | number` 窗口的 ID 或者窗口的名字。
- funcName：`string` 访问的服务的函数名。
- [args]：`any[]` 访问服务函数的参数。
#### 返回值
- `Promise<any>` 服务访问结果。

:::warning 警告
- 当 `receiver` 为窗口名，并且同名窗口打开多个，此时 `callBrowserWindow` 的返回值为数组，每一项表示每一个窗口的执行结果。
- 当有且仅有一个窗口的时候，返回结果仅仅为该窗口的函数执行结果，不是数组。
:::


### registerBeforeClose

`winService.registerBeforeClose(callback)`

#### 参数
- callback：`(reason: Object) => boolean | Promise<boolean>`，窗口关闭前确认回调，返回 `false` 则取消关闭，否则继续关闭。
  - reason：Object，关闭原因。

#### 返回值
- `IDisposable`，返回消息监听引用，可使用 `.dispose()` 解除监听。

```ts
export enum CloseReason {
  /** Window is closed */
  CLOSE = 1,

  /** Application is quit */
  QUIT = 2,

  /** Window is reloaded */
  RELOAD = 3,

  /** Other configuration loaded into window */
  LOAD = 4,
}
```

- 窗口关闭前，可注册确认关闭函数，根据返回结果决定窗口是否关闭。
- 可注册多个事件，若有一个事件取消关闭，则窗口不再关闭。

:::info 补充信息
[`registerBeforeClose` 示例](/docs/guides/features/electron/win-manager/close-window#忽略所有回调直接关闭窗口)。
:::



### registerWillClose

`winService.registerWillClose(callback)`

#### 参数
- callback：`(reason: CloseReason) => boolean | Promise<boolean>`，即将关闭窗口处理函数。

#### 返回值
- `IDisposable`，返回消息监听引用，可使用 `.dispose()` 解除监听。

窗口即将关闭，注册关闭前收尾工作函数，不能阻止窗口关闭。

:::info 补充信息
[`registerWillClose` 示例](/docs/guides/features/electron/win-manager/close-window#窗口关闭前做一些收尾工作)。
:::

### registerServices

`winService.registerServices(services)`
#### 参数
- services：`{ [key: string]: unknown }`，需要注册的服务。
#### 返回值
- `void`。

```ts
  registerServices(services: { [key: string]: unknown }): void;
```
注册服务，供其余窗口访问。

:::info 补充信息
更多关于服务注册：[双向通信](/docs/guides/features/electron/ipc/regist-services/render)。
:::

### onMessage

`winService.onMessage(channel)`

#### 参数
- channel：`string`，频道名。
#### 返回值
- `object`，返回仅监听 channel 频道的事件监听器。

返回仅监听 channel 频道的事件监听器。

:::info 补充信息
更多关于服务注册：[双向通信](/docs/guides/features/electron/ipc/regist-services/render)。
:::

### disposeWebviewConnection

`winService.disposeWebviewConnection(webviewIds)`
#### 参数
- webviewIds：`string[]`，所有 webview 的 ID。

#### 返回值
- `Promise<void>`。

关闭所有 webview 与主进程的通信连接。这一般会在组件写在前执行。窗口关闭时，会默认执行此逻辑。


### 示例

```ts
import  { winService } from '@modern-js/runtime/electron-render';
...

// 向窗口 main 发送消息 `{data: "hello"}` 到 `msgChannel` 频道。
winService.callOtherWindow('main', 'msgChannel', {data: "hello"});

// 向所有窗口发送消息 `{data: "hello"}` 到 `msgChannel` 频道。
winService.broadCast('msgChannel', {data: "hello"});

// 监听 'ON_HELLO' 频道消息
const onHello = winService.onMessage('ON_HELLO');
const listener = onHello((msg) => { console.log('handle onHello ') });

// 注册服务
winService.registerServices({
  readFile: () => {
    console.log('read file');
  }
});

// 关闭当前窗口
winService.closeCurrentWindow();

```

#### 窗口即将关闭，是否继续关闭。

```ts
// 窗口即将关闭，是否继续关闭
const onBeforeCloseListener = winService.registerBeforeClose(
  () => {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: '确定要退出应用吗',
        okText: '退出',
        cancelText: '取消',
        icon: null,
        async onOk() {
          return resolve(false);
        },
        onCancel() {
          return resolve(true);
        },
      });
    });
  }
);

onBeforeCloseListener.dispose();

```

#### 窗口即将关闭，你可以做一些事情，并等待你完成后，会关闭窗口。

```ts
const willCloseListener = windowService.registerWillClose(() => {
    console.log('I can do something before close');
    return Promise.resolve();
});

willCloseListener.dispose();
```


