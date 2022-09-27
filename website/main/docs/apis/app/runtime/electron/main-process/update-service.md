---
sidebar_position: 2
---

# updateService

:::info 补充信息
* 升级管理服务
* 使用进程：[主进程](/docs/guides/features/electron/basic#主进程)。

```ts
import { updateService } from '@modern-js/runtime/electron-main';
```
:::

## 实例方法

### checkForUpdates

`updateService.checkForUpdates(options)`
#### 参数
- options：`object`，检查升级选项。
  - receiver：`string`，接收升级进度消息的窗口名。
  - url：`string`，检测升级版本文件的地址。（`xx.yml` 文件的父目录）。
#### 返回值
- `void`。

检查应用更新。

### quitAndInstall

`updateService.quitAndInstall([isSilent])`

#### 参数

- [isSilent]：`boolean`，是否静默升级。

#### 返回值
- `Promise<void>`。

退出并应用更新，最终调用 `electron-updater` 的 `appUpdater.quitAndInstall(isSilent)`。

