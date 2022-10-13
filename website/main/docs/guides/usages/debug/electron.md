---
title: Electron 模式
sidebar_position: 4
---

# 调试应用

## 开发环境调试应用
在 Electron 开发环境下，一般需要调试**主进程**、**渲染进程**两种进程。

- 对于**主进程**，可以在源码（比如：TS 文件上）直接设置断点，通过 VS Code 的 Debug 终端启动主进程来进行 Debug 调试。
- 对于**渲染进程**，在开发者工具中设置断点，即可调试。

## 生产环境调试应用
对于生产环境的调试，同样分为两种：

### 调试主进程
对于主进程，只需在打包主进程代码的时候，设置相关参数即可。在 Modern.js 应用项目中**启用「Electron」模式**的情况下，会有如下可执行命令:

```js
"build:main": "modern build electron-main --development"
```

这样，打包后的主进程代码不会被混淆压缩。根据复制到应用中的主进程代码位置。比如（一般在如下位置）：

`./release/mac/test_modern_electron.app/Contents/Resources/app/electron`。

直接在主进程源码里，通过修改源码输出日志或者调试部分代码，进行 Debug 调试。

### 调试渲染进程

打开窗口的开发者工具，进行 Debug 即可。
