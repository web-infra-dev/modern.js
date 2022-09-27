---
sidebar_position: 6
---

# updateService

:::info 补充信息
* 升级服务。
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { updateService } from '@modern-js/runtime/electron-render';
```
:::

## 实例方法

### `onUpdateProgress`

`updateService.onUpdateProgress(callback)`
#### 参数
- callback：`(progress: IUpdateProgressInfo) => void`，监听升级进度回调。
#### 返回值
- `IDisposable`，返回消息监听引用，可使用 `.dispose()` 解除监听。

更新进度的监听。

### `onUpdateIdle`
`updateService.onUpdateIdle(callback)`
#### 参数
- callback：`() => void`，监听暂无版本更新回调。
#### 返回值
- `IDisposable`，返回消息监听引用，可使用 `.dispose()` 解除监听。


无到更新版本监听。

### `onUpdateError`

`updateService.onUpdateError(callback)`

#### 参数
- callback：`(err: any) => void`，监听升级错误回调。
#### 返回值
- `IDisposable`，返回消息监听引用，可使用 `.dispose()` 解除监听。

更新失败监听。

### `onUpdateDone`

`updateService.onUpdateDone(callback)`
#### 参数
- callback： `() => void`，监听升级完成回调。
#### 返回值
- `IDisposable`，返回消息监听引用，可使用 `.dispose()` 解除监听。


下载完成监听。

### `restartAndInstall`

`updateService.restartAndInstall()`
#### 返回值
- `void`。

重启并更新应用。

### 示例
```ts

import bridge from '@modern-js/electron-bridge';

const { updateService } = bridge;

const App: React.FC = () => {
   useEffect(() => {
      // 检查更新
      updateService.checkUpdate({
          url: 'xxx/xx'
      });

     // 添加监听
     const doneListener = updateService.onUpdateDone(() => {
        console.log('update done')
        // 重启并更新
        updateService.restartAndInstall();
      });
     const errListener = updateService.onUpdateError(err => console.log(err));
     const idleListener = updateService.onUpdateIdle(() => console.log('no update available'));
     const progressListener = updateService.onUpdateProgress((progress: any) =>
        console.log('progress:', progress),
      );

      return () => {
          // 取消监听
          doneListener.dispose();
          errListener.dispose();
          idleListener.dispose();
          progressListener.dispose();
      }
   }, [])

    return <div>demo</div>;
}

```
