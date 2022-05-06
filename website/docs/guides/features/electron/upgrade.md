---
sidebar_position: 7
---

# 升级

在我们开发应用完成后，一般需要做版本管理与升级。流程如下：

- 构建应用。
- 上传构建产物与版本文件（如：云存储）。
- 检查更新。
- 下载与更新。

:::info 补充信息
在我们检查更新的环节，还可以新增一个步骤叫作：升级策略检测。比如：
- 灰度升级、小流量升级。
- 启用和禁用版本。
- 存在发布升级相关版本信息。
- ...

因此，我们可以建立一个版本策略管理平台，在原有的升级流程前提供一个版本检测接口。
:::

## 升级流程

:::info 补充信息
下述示例以[【窗口中关闭 Node】](/docs/guides/features/electron/develop#窗口中关闭-node推荐)的开发方式来演示。
:::

我们在分别在主进程和渲染进程里提供了升级服务：`updateService`。

### 主进程中定义检查更新
我们在主进程 `electron/services/index.ts（主进程）` 中定义一个检测升级的函数。

```ts title='electron/services/index.ts（主进程）'

export const startToUpdate = (url: string) => {
  return updateService.checkForUpdates({
    url,
    receiver: 'main'
  })
}
```
- `url` 为检测升级的版本文件所在文件夹。
  - 比如升级版本文件 latest.yml 所在地址为：`https://xxx/xxx/latest.yml`，则检测升级的 url 为：https://xxx/xxx

- `receiver` 为接收升级消息的窗口名。

:::info 补充信息

* 我们本质上使用的是 electron-updater 进行升级，因此，升级流程主要在主进程中，渲染进程负责升级交互即可。
* 我们检测升级也是在主进程里实现，渲染进程里触发。因此，我们定义检测升级函数在主进程中。
:::

### 预加载脚本中提供检测升级函数

```ts title='electron/preload/browserWindow/index.ts'
export const apis = {
  ...
  startToUpdate: (url: string) => {
    return callMain('startToUpdate', url)
  },
}
```

### 页面中升级交互

- 点击按钮，检测升级。

```ts
// 渲染进程中（比如： App.tsx）
import bridge from '@modern-js/runtime/electron-bridge';

<button
  type="button"
  onClick={() => {
  bridge.startToUpdate('https://xx/xx')
}}>
  检测更新
</button>
```

- 注册升级流程回调。

```ts
// 渲染进程中（比如： App.tsx）
import bridge, { IUpdateProgressInfo } from '@modern-js/runtime/electron-bridge';

 useEffect(() => {
    const idleListener = bridge.updateService.onUpdateIdle(() => {
      console.log('暂无可用更新版本');
    });
    const updateProgressListener = bridge.updateService.onUpdateProgress((progress: IUpdateProgressInfo) => {
      console.log('升级进度信息:', progress);
    });
    const updateErrorListener = bridge.updateService.onUpdateError((err: any) => {
      console.error('升级失败:', err);
    });
    const updateDoneListener = bridge.updateService.onUpdateDone(() => {
      console.error('升级完成, 重启');
      bridge.updateService.restartAndInstall();
    });
    return () => {
      // 解除监听
      idleListener.dispose();
      updateProgressListener.dispose();
      updateErrorListener.dispose();
      updateDoneListener.dispose();
    }
  }, [])
```

:::warning 警告
上述检测升级，electron-builder 默认逻辑如下：
* 如果检测到版本比当前版本更大，则直接下载，否则不下载。

:::
