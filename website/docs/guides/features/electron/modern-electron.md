---
sidebar_position: 2
---

# Modern Electron 简介

**Modern Electron** 是基于 Electron 的桌面端应用框架，它帮助我们：

- 创建基本的工程。包含：基本的目录结构组织、相关 CLI（启动、构建）。
- 协助我们开发，减少重复建设工作，降低开发复杂度。提供：窗口管理、进程通信、升级等相关通用服务。
- 简化工程化复杂度，降低工程化门槛。提供：简化后的构建配置、不同进程的构建命令。
- 支持一套代码，多端发布（Web 端和桌面端）。可以接入任意 Web 项目，零成本转为桌面应用，并做持续开发集成。
- 提供测试框架，支持功能性代码的测试。比如：测试功能函数、进程通信、多应用实例之间交互流程等。

主要由以下部分组成：

- cli：底层开发工具，在整个开发流程中有着不可或缺的作用。
  - 本地开发、代码构建、应用打包。
- runtime：提供窗口管理、进程通信、应用升级、生命周期管理等能力。
- bridge：提供安全、可靠的通信 bridge，简化了通信机制的同时，也保证了项目安全性。
- test：测试框架，支持功能性代码的测试。比如：测试功能函数、进程通信、多应用实例之间交互流程等。


## 整体架构

![架构图](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/electron/electron6.png)

## 适用人群

- 零桌面端基础的 web 前端开发者。
- 有一定桌面端经验，希望提升项目可维护性、安全性、稳定性的高级前端开发。

## 创建项目

<details>
  <summary>npx @modern-js/create test_modern_electron</summary>

  ```bash
    npx @modern-js/create test_modern_electron
    npx: 1 安装成功，用时 7.108 秒
    ? 请选择你想创建的工程类型 应用
    ? 请选择开发语言 TS
    ? 请选择包管理工具 pnpm
    ? 是否需要支持以下类型应用 Electron
    ? 是否需要调整默认配置? 否
  ```

  #### 执行后我们可以得到以下产物：

  ```bash
  ├── README.md
  ├── config
  │   └── electron
  │       ├── entitlements.mac.plist # mac 权限配置文件
  │       ├── icon.icns # mac 应用图标
  │       ├── icon.ico # windows 应用图标
  │       └── logo.png
  ├── electron
  │   ├── main.ts #  主进程入口文件
  │   ├── modern-app-env.d.ts
  │   └── tsconfig.json
  ├── modern.config.js # 框架配置文件
  ├── package.json
  ├── pnpm-lock.yaml
  ├── src # 前端
  │   ├── App.css
  │   ├── App.tsx
  │   └── modern-app-env.d.ts
  └── tsconfig.json
  ```

</details>

## 启动

在`package.json`中添加一下命令：

```bash
"dev": "modern dev" # 启动渲染进程,
"dev:main": "modern dev electron-main" # 启动主进程,
"dev:electron": "modern dev electron" # 语法糖，同时启动渲染进程和主进程,
```

参考【[启动命令](docs/apis/commands/mwa/dev)】。

## 为主入口添加逻辑

修改`electron/main.ts`文件，增加代码逻辑：

```ts
import { app } from 'electron';
import Runtime, { winService } from '@modern-js/runtime/electron-main';

 const runtime = new Runtime({
    windowsConfig: [{
      name: 'main',
    }],
    mainServices: {
    openWindow: (winName: string) => {
      return winService.createWindow({ name: winName })
    }
  },
});

app.whenReady().then(async () => {
  await runtime.init();
  winService.createWindow({
    name: 'main',
  })
});

```

## 打包

```bash
"build": "modern build" # 构建渲染进程,
"build:main": "modern build electron-main" # 构建主进程,
"build:app": "modern build electron-app" # 构建安装程序,
"build:electron": "modern build electron" # 语法糖，按顺序构建渲染进程、主进程、安装程序,
```

:::info 补充信息
更多关于【[打包命令](/docs/apis/commands/mwa/build)】。
:::
