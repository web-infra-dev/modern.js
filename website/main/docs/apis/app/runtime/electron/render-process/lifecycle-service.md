---
sidebar_position: 7
---


# lifecycleService

:::info 补充信息
* 应用管理服务。
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { lifecycleService } from '@modern-js/runtime/electron-render';
```
:::

## 实例方法

### quit

`lifecycleService.quit()`

#### 返回值
- `Promise<boolean>`，是否成功退出。

退出应用。

:::tip 提示
最终执行主进程：`lifecycleService.quit()`。
:::


### kill

`lifecycleService.kill([code])`
#### 参数
- [code]：`number`，退出 code。

#### 返回值
- `Promise<void>`。

退出应用。

:::tip 提示
最终执行主进程：`lifecycleService.kill`。
:::

### relaunch

`lifecycleService.relaunch([options])`
#### 参数
- [options]：`IRelaunchOptions`， 重启选项。
  - [addArgs]：`string[]`，重启时增加一些参数，默认为：`[]`。
  - [removeArgs]：`string[]`，重启时移除一些参数，默认为：`[]`。
  - [forceQuit]：`boolean`，重启时是否强制退出，忽略所有回调，默认为：`false`。

#### 返回值
- `Promise<void>`。

重启应用。


:::tip 提示
- 最终执行主进程：`lifecycleService.relaunch`。
- 参数：addArgs、removeArgs 均表示从 process.argv 中获取当前启动参数后，向其中添加或减少参数，再进行重启。
:::

