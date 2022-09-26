---
sidebar_position: 1
---

# winService

:::info 补充信息
* 窗口管理服务。
* 使用进程：[主进程](/docs/guides/features/electron/basic#主进程)。

```ts
import { winService } from '@modern-js/runtime/electron-main';
```
:::

## 实例方法

### callBrowserWindow

`winService.callBrowserWindow(receiver, funcName[, ...args])`

#### 参数

- receiver：`number | string`，接收窗口 ID 或者窗口名。
- funcName：`string`，访问的服务的函数名。
- [args]：`any[]`，访问服务函数的参数。

#### 返回值
- `Promise<any>`，服务访问结果。

:::warning 警告
当 `receiver` 为窗口名，并且同名窗口打开多个，此时 `callBrowserWindow` 的返回值为数组，每一项表示每一个窗口的执行结果。
:::


### broadCast

`winService.broadcast(channel[,...args])`

#### 参数
- channel：`string`，广播频道名。
- [args]：`any[]`，广播参数。

#### 返回值
- `void`。

给所有窗口在 `channel` 频道上发送消息。


### getWindowById

`winService.getWindowById(windowId)`

#### 参数

- windowId：`number`，窗口 ID。

#### 返回值
- `object | undefined`，返回窗口对象。

根据窗口 ID 获取窗口对象。

### getWindows

`winService.getWindows()`

#### 返回值
- `object[]`，返回窗口对象数组。


获取所有窗口对象。

### sendTo

`winService.sendTo(receiver,channel[,...args])`

#### 参数

- receiver：`number | string`，接收窗口 ID 或者窗口名。
- channel：`string`，通信频道名。
- [args]：`any[]`，访问服务函数的参数。

#### 返回值
- `void`。

根据窗口名字或者窗口 ID 发送消息到 `channel` 频道。

### createWindow

`winService.createWindow(openConfig)`

#### 参数
- openConfig：`object`，窗口配置。
  - name：`string`，需要打开的窗口名。
  - [options]：[`BrowserWindowConstructorOptions`](https://www.electronjs.org/zh/docs/latest/api/browser-window#new-browserwindowoptions)，窗口的相关配置。
  - [loadUrl]：`string`，加载路径。
  - [addBeforeCloseListener]：`boolean`，同[`windowConfig#addBeforeCloseListener`](/docs/apis/runtime/electron/main-process/window-config)，默认为 `false`。
  - [hideWhenClose]：`boolean`，关闭窗口时，是否以隐藏代替关闭，默认为 `false`。


#### 返回值
- `object`，返回窗口对象。

打开窗口。

### getWindowConfig

`winService.getWindowConfig(name)`
#### 参数
- name：`string`，窗口名。

#### 返回值
- `object | undefined`，窗口配置。

通过窗口名获得窗口配置。

### closeWindowById

`winService.closeWindowById(id[,options])`

#### 参数
- id：`number`，窗口 ID。
- [options]：`object`，关闭模式。
  - [closeMode]：`'close' | 'confirmOrClose'`，当 `closeMode=close` 时，会直接关闭，忽略回调。当 `closeMode=confirmOrClose`，如果有确认回调，会执行确认回调，默认为：`confirmOrClose`。
#### 返回值
- `void`。

根据窗口 ID 关闭窗口。


### closeWindowByName

`winService.closeWindowByName(name[,options])`
#### 参数
- name：`string`，窗口名。
- [options]：`object`，关闭模式。
  - [closeMode]：`'close' | 'confirmOrClose'`，当 `closeMode=close` 时，会直接关闭，忽略回调。当 `closeMode=confirmOrClose`，如果有确认回调，会执行确认回调，默认为：`confirmOrClose`。
#### 返回值
- `void`。

根据窗口名关闭窗口。

:::tip 提示
关于 closeMode，同上方 `closeWindowById`。
:::

### getWindowByName

`winService.getWindowByName(name)`
#### 参数

- name：`string`，窗口名。
#### 返回值
- `object[]`，窗口对象数组。

根据窗口名获得其对应配置。

### 示例

```ts
// in main process
import { winService } from '@modern-js/electron-runtime';
...

// 向窗口 main 发送消息 `{data: "hello"}` 到 `msgChannel` 频道。
winService.call('main', 'msgChannel', {data: "hello"});

// 向所有窗口发送消息 `{data: "hello"}` 到 `msgChannel` 频道。
winService.broadCast('msgChannel', {data: "hello"});
```
:::warning 警告
你可以直接引用各种服务，比如：winService，但使用必须在 `await runtime.init()` 之后，这会初始化所有服务。
:::
