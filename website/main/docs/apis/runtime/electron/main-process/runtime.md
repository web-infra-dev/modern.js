---
sidebar_position: 0
---

# Runtime

:::info 补充信息
* 用于框架启动初始化功能。
* 使用进程：[主进程](/docs/guides/features/electron/basic#主进程)。

```ts
import Runtime from '@modern-js/runtime/electron-main';
```
:::
## Class: Runtime

`new Runtime([options])`

### 参数
- [options]：`Object`
  - windowsConfig：`Object[]`，窗口配置，供窗口管理服务使用。详见：[窗口配置](/docs/apis/runtime/electron/main-process/window-config)。
  - [windowsBaseConfig]：`Object`，窗口的通用基础配置。
    - [devBaseUrl]：`(winName: string) => string`，开发环境下窗口加载的基础路由，默认返回 `http://localhost:8080/${winName}`。（当 `winName === 'main'` 时，返回：http://localhost:8080）。
    - [prodBaseUrl]：`(winName: string) => string`，生产环境下窗口加载的基础路由，默认返回 `html/${winName}/index.html`。
  - [mainServices]：`{ [key: string]: unknown }` 主进程注册提供的服务，供渲染进程访问。
  - [menuTemplate]：`(Electron.MenuItemConstructorOptions | Electron.MenuItem)[]`，Electron 应用菜单。
### 返回值
返回 `Runtime` 实例。

## 实例方法

### `runtime.init`

`runtime.init()`

#### 返回值
- `Promise<void>`。

在 Electron 原生 `app.whenReady` 生命周期中执行此方法，用于初始化环境、实例化服务等工作。


## 示例

```ts title="electron/main.ts"
import Runtime from '@modern-js/runtime/electron-main';
const runtime = new Runtime({
  windowsConfig,
  mainServices: services,
});

app.whenReady().then(async () => {
  await runtime.init();
  ...
});
```
