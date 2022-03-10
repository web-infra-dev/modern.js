# Electron Test

为 Electron 应用编写自动测试, 你需要一种 “驱动” 应用程序的方法。[Spectron](https://www.electronjs.org/spectron) 是一种常用的解决方案, 它允许您通过 [WebDriver](https://webdriver.io/) 模拟用户行为。

当然，也可以使用 Node 的内建 IPC STDIO 来编写自己的自定义驱动。
自定义驱动的优势在于，它往往比 Spectron 需要更少的开销，并允许你向测试套件公开自定义方法。

## Class: TestDriver

:::info 补充信息
```ts
import TestDriver from '@modern-js/electron-test';
```
:::


`new TestDriver(options)`

#### 参数
- options：`object`，测试驱动配置。
  - cwd：`string`，测试执行目录。
  - [envs]：`object`，执行的环境变量。

#### 返回值
- 返回 `TestDriver` 实例。

创建一个 `TestDriver` 实例，这会启动一个`Electron` 应用实例。

:::warning 警告
当我们需要启动多个实例的时候，我们需要在环境变量中添加：`TEST_FOLDER` 变量，用于区分实例运行目录。
比如：
```ts
new TestDriver({
  cwd: 'xxx/electron',
  envs: {
    TEST_FOLDER: 'test1'
  }
})
```
:::

## 实例方法

### `testDriver.isRunning()`
#### 返回值
- `boolean`，是否处于运行中。

返回当前实例是否仍然处于运行中。

### `testDriver.checkReady(options)`

#### 参数
- options：`object` 检查是否处于已就绪状态。
  - [winName]：`string`，窗口名。
  - [webviewId]：`string`，webview 的 ID。


#### 返回值
- `Promise<boolean>`，是否已经就绪。


如果没有传窗口名，则此方法表示检测主进程是否启动完毕；
如果传递窗口名，则表示检测窗口是否加载完毕；
如果传递了窗口名，且传递了 webview 的 ID，则表示检查，某个窗口下，某个 webview 是否已加载完毕。

### `testDriver.whenReady([winName,options])`

#### 参数
- [winName]：`string`，窗口名。
- [options]：`object` 。
  - [timeout]：`number`，等待超时时间，默认值 10000。
  - [webviewId]：`string`，webview 的 ID。

#### 返回值
- `Promise<boolean>`，是否已经就绪。

:::tip 提示
* 当没有传递 `winName`时，表示当主进程加载完毕时；
* 当传递了窗口，没有传递其他选项时，表示当窗口`winName`加载完毕时；
* 当传递了窗口名，且传递了`webviewId`，表示当窗口`winName`的 ID 为 `webviewId`的`webview`加载完毕时。
其中，`timeout` 为等待`webview`加载完毕的时间，超时则抛出异常。
:::

### `testDriver.stop()`

### 返回值
- `void`。

停止实例。

### `testDriver.call(options)`

#### 参数
- options：`object`，访问参数。
  - [funcName]：`string`，需要测试的函数名。
  - [winName]：`string`，需要测试的窗口名。
  - [args]：`any[]`，测试函数时传递的参数。
#### 返回值
- `Promise<any>`，访问结果。

:::tip 提示
* 当传递了`funcName`，未传递`winName`时，则表示测试主进程注册的服务函数`funcName`；
* 当传递了`funcName`与`winName`，则表示测试窗口`winName`中的服务函数`funcName`；
`args` 为执行函数的参数。
* 更多测试，请看[【测试示例】](/docs/guides/features/electron/test/index)。
:::
