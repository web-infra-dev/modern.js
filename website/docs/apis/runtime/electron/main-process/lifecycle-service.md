---
sidebar_position: 3
---

# lifecycleService

:::info 补充信息
* 应用管理服务。
* 使用进程：[主进程](/docs/guides/features/electron/basic#主进程)。

```ts
import { lifecycleService } from '@modern-js/runtime/electron-main';
```
:::
## 实例方法

### quit

`lifecycleService.quit()`

#### 返回值
- `Promise<boolean>`，退出成功与否。

退出应用。
:::tip 提示
最终会调用：`app.quit()`。
:::


### kill

`lifecycleService.kill([code])`
#### 参数
- [code]：`number` 退出 code。

#### 返回值
- `void`。

退出应用。

:::tip 提示
最终调用：`app.exit(code)`，详见：[electron#app#exit](https://www.electronjs.orgdocs/apis/app#appexitexitcode)。
:::


### relaunch

`lifecycleService.relaunch([options])`

#### 参数
- [options]：`IRelaunchOptions`， 重启选项。
  - [addArgs]：`string[]`，重启时增加一些参数，默认为：`[]`。
  - [removeArgs]：`string[]`，重启时移除一些参数，默认为：`[]`。
  - [forceQuit]：`boolean`，重启时是否强制退出，忽略所有回调，默认为：`false`。

#### 返回值
- `void`。

重启应用。


:::tip 提示
- 最终调用：`app.relaunch({ args })`。
- 参数：addArgs、removeArgs 均表示从 process.argv 中获取当前启动参数后，向其中添加或减少参数，再进行重启。
:::

