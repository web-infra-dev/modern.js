---
sidebar_position: 4
---

# 开发桌面应用

本章将介绍如何使用 Modern.js，进行桌面应用开发。本章对应的代码仓库地址为：[middle-platform-electron](https://github.com/modern-js-dev/modern-js-examples/tree/main/quick-start/middle-platform-electron)。

通过本章你可以了解到：

- 桌面应用项目：创建与开发调试。
- 桌面应用项目结构。
- 桌面应用基本开发流程。

:::tip 提示
- 上一章节中，着重讲解了如何使用 Modern.js，进行中后台项目的开发，此处不再重复，以在 Electron 中的开发为主。
- 本章节以渲染进程[**关闭 Node **](/docs/guides/features/electron/develop)开发为例，进行讲解。
:::





## 环境准备

import EnvPrepare from '@site/docs/components/env-prepare.md';

<EnvPrepare />

## 创建项目

使用 `@modern-js/create` 创建新项目，运行命令如下：

```bash
npx @modern-js/create middle-platform-electron
```

:::tip 提示
middle-platform-electron 为创建的项目名。
:::

按照如下选择，生成项目：

```bash
? 请选择你想创建的工程类型： 应用
? 请选择开发语言： TS
? 请选择包管理工具： pnpm
? 是否需要支持以下类型应用： Electron
? 是否需要调整默认配置： 否
```
目录结构如下：

```bash
.
├── README.md
├── config
│   └── electron
│       ├── entitlements.mac.plist // mac 下应用权限文件
│       ├── icon.icns // mac 应用图标
│       ├── icon.ico // windows 应用图标
│       └── logo.png
├── electron // 主进程代码目录
│   ├── main.ts // 主进程默认入口文件
│   ├── modern-app-env.d.ts
│   └── tsconfig.json
├── modern.config.js
├── package.json
├── pnpm-lock.yaml
├── src // 渲染进程代码
│   ├── App.css
│   ├── App.tsx
│   └── modern-app-env.d.ts
└── tsconfig.json
```

## 启用 Electron

如果已经存在 Modern.js 项目，则只需要启用 Electron 功能。

首先执行 `pnpm run new`：

```bash
(base) ➜  modernjs-1.0.0 git:(master) pnpm run new

> modernjs-1.0.0@0.1.0 new /Users/kp/Documents/work/modernjs-1.0.0
> modern new

? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「Electron」模式

[INFO] 依赖自动安装成功
[INFO] 启用 Electron 模式成功!
可在项目的目录下运行以下命令：
pnpm run dev:electron # 按开发环境的要求，启动 Electron
pnpm run build:electron # 按产品环境的要求，构建 Electron 项目
```

然后，在项目 `modern.config.js` 下新增如下相关配置：

```ts
export default defineConfig({
  output: {
    assetPrefix: '../../',
  },
  runtime: {
    state: true,
    router: {
      supportHtml5History: process.env.NODE_ENV === 'development',
    },
  },
  electron: {
    builder: {
      baseConfig: {
        appId: 'com.bytedance.demo',
        // eslint-disable-next-line no-template-curly-in-string
        artifactName: 'demo_${env.VERSION}.${ext}',
        files: [
          {
            from: '.',
            to: '.',
            filter: ['!**/*.map', '!**/*.d.ts', '!*.log', '!*.lock'],
          },
        ],

        directories: {
          app: 'dist',
        },
      },
    },
  },
}
```

:::tip 提示
如果在 package.json 以存在部分相同配置，则需要删除其中一个即可。
:::

## 开发调试

进入项目根目录，之后执行 `pnpm run dev:electron` 即可启动应用：

```bash
# 进入项目根目录
cd middle-platform-electron

# 启动开发服务器
pnpm run dev:electron
```

:::info 补充信息
启动时，可以将主进程、渲染进程分开启动，`package.json` 中的命令如下：

```json
{
  "dev": "modern dev", // 启动渲染进程
  "dev:main": "modern dev electron-main" // 启动主进程
}
```

:::

## 打开窗口

### 主进程注册打开窗口函数
在 Electron 中，一般在主进程里进行窗口管理。因此，我们在主进程注册窗口打开函数。

```ts title='electron/main.ts'
import Runtime, { winService } from '@modern-js/runtime/electron-main';
// ...
const runtime = new Runtime({
  // ...
  mainServices: {
    openWindow: (winName: string) => {
      return winService.createWindow({ name: winName });
    }
  },
});
```

:::info 补充信息
更多信息，请参考【[主进程注册服务](/docs/guides/features/electron/ipc/regist-services/main)】。
:::

### 新建预加载脚本目录

我们在窗口中，关闭了 Node 配置。因此，我们通过 Electron 提供的预加载脚本的形式进行开发，我们在预加载脚本里将 Node 相关 API 注入到全局变量，从而在渲染进程中即可使用。

首先，我们新建 `electron/preload/index.ts`，并在其中通过 API `exposeInMainWorld` 注册窗口打开函数。

```ts title='electron/preload/index.ts'
import {
  exposeInMainWorld,
  browserWindowPreloadApis,
} from '@modern-js/runtime/electron-render';

const { callMain } = browserWindowPreloadApis;
export const apis = {
  ...browserWindowPreloadApis,
  openWindow: (winName: string) => {
    return callMain('openWindow', winName);
  },
};

exposeInMainWorld(apis);
```

:::tip 提示
- 此处从 `'@modern-js/runtime/electron-render'` 引入的 `exposeInMainWorld` 与 Electron 原生的有点差异。
- 此处的 `exposeInMainWorld` 相当于 Electron 中的：`(apis: any) => exposeInMainWorld('bridge', apis);`。
:::


### 窗口预加载脚本路径配置

我们只需要在窗口配置上，增加预加载脚本路径即可。

在开发时，由于在 Electron 中，`BrowserWindow` 对象预加载脚本为：JavaScript。
因此我们新建一个文件，通过 Babel 编译 TS。

```js title='electron/preload/index.dev.js'
const { join } = require('path');
const babel = require('@babel/register');
const { babelConfig } = require('@modern-js/plugin-electron/tools');

babel(
  Object.assign(babelConfig, {
    extensions: ['.ts', '.js'],
  }),
);
require(join(__dirname, 'index.ts'));
```
:::tip 提示
此文件，仅在开发时有用，构建后均为 JS 文件，无需做转化。
:::

然后，我们对脚本路径进行配置：

```ts title='electron/main.ts'
import { join } from 'path';

// preload js for browserwindow to provide native apis for render-process
const PRELOAD_JS = join(
  __dirname,
  'preload',
  'browserWindow',
  process.env.NODE_ENV === 'development' ? 'index.dev.js' : 'index.js',
);

const runtime = new Runtime({
  windowsConfig: [{
    name: 'main',
    options: {
      webPreferences: {
        preload: PRELOAD_JS
      }
    }
  }],
  // ...
});
```

### 新增窗口

当我们使用框架提供的 `winService` 做窗口管理时，新增窗口，只需要在启动时，添加一个窗口配置即可。

```ts title='electron/main.ts'
const runtime = new Runtime({
  windowsConfig: [{
    name: 'main',
    options: {
      webPreferences: {
        preload: PRELOAD_JS
      }
    }
  }, {
    name: 'console'
  }],
  // ...
});
```
如上，我们新增了 `console` 窗口配置。

:::info 补充信息
- 如果不配置加载路径，则此窗口打开的时候，默认加载名为 `console` 的入口路径。
- 【[开发中后台应用](/docs/start/admin)】中，已经介绍过如何新增一个入口，这里不再重复。
:::

### 在渲染进程中打开窗口

我们所有在预加载脚本中注册的服务，均可使用 `bridge` 在页面中进行访问。
比如，上面我们在预加载脚本中注册了 `openWindow`，即可这样使用：

```tsx title="xx/xx.tsx（渲染进程）"
import bridge from '@modern-js/runtime/electron-bridge';

<button type="button"
  onClick={() => {
    bridge.openWindow('console')
  }}
>打开 console 窗口</button>
```

此时，你可能会遇到找不到 `openWindow` 的类型提示错误。因为我们扩展后，没做类型定义，我们可以如下扩展类型，后续就不需要类型定义了。

- 新增类型定义文件 `typings/index.d.ts`：

```ts
declare module '@modern-js/electron-runtime' {
  export type BrowserWindowApis = typeof import('../electron/preload').apis;
}
```

- 在项目根目录 `tsconfig.json` 中配置 `"types": ["./typings"]`：

```json
{
  "compilerOptions": {
    // ...
    "types": ["./typings"]
  },
  // ...
}

```

## 构建应用

在根目录下，直接执行 `pnpm run build:electron` 即可对应用进行构建。

产物如下：

```bash
release/
├── builder-debug.yml
├── builder-effective-config.yaml
├── demo_1.0.0.dmg # 安装包
├── demo_1.0.0.dmg.blockmap
├── demo_1.0.0.zip
├── demo_1.0.0.zip.blockmap
├── latest-mac.yml
└── mac # 免安装版
```

:::info 补充信息
默认针对 macOS 系统做构建，更多操作系统打包请参考【[构建](/docs/guides/features/electron/pack)】。
:::

## 测试

### 测试主进程服务

我们在主进程里新建一个服务函数：

```ts title='electron/main.ts'
const runtime = new Runtime({
  windowsConfig,
  mainServices: {
    // ...
    getWindowCount: () => {
      return winService.getWindows().length;
    }
  },
});
```

接着，我们通过 `testServices` 注册该服务即可。

```ts title='electron/main.ts'
import { testServices } from '@modern-js/electron-test/main';
// ...

const runtime = new Runtime({
  windowsConfig,
  mainServices: testServices({
    // ...
    getWindowCount: () => {
      return winService.getWindows().length;
    }
  }),
});
```

:::tip 提示
`testServices` 不影响构建产物。
:::

新建相关测试文件：

```ts title='electron/tests/index.test.ts'
/**
 * @jest-environment @modern-js/electron-test/dist/js/node/testEnvironment.js
 */
import './main-process';

jest.setTimeout(100000);

```

此文件在加载的时候，会加载 `@jest-environment` 环境，启动一个 Electron 应用实例，挂载到
`global` 对象上。

```ts title='electron/tests/main-process/index.ts'
// test main services

import TestDriver from '@modern-js/electron-test';

let testDriver: TestDriver | null = null;

jest.setTimeout(100000);

beforeAll(async () => {
  testDriver = (global as  any).testDriver;
  // 当 main 窗口加载完毕
  await testDriver?.whenReady('main');
});

describe('test main process services', () => {
  it('test window count', async () => {
    // 调用主进程服务-getWindowCount
    const windowsCount = await testDriver?.call({
      funcName: 'getWindowCount',
    })
    expect(windowsCount).toEqual(1);
  })
})

```

:::info 补充信息
更多信息，请参考【[Electron 测试](/docs/guides/features/electron/test)】。
:::
