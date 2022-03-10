---
sidebar_position: 1
---

# Electron 简介

Electron 是使用 JavaScript，HTML 和 CSS 构建跨平台的桌面应用程序的框架。换一个角度理解，其实是一个可以用 **JavaScript、HTML 和 CSS** 构建桌面应用程序的库，一个 JavaScript 运行环境。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/electron/electron.png)

它由上图所示 Electron 环境由：浏览器环境 +  Node 环境 + 操作系统 Native API 共同组成。

### 主进程

我们在启动任何应用的时候，都会开启一个进程，表示应用进程，用于和操作系统打交道。比如：打开一个系统窗口。

因此，这个应用进程，在 Electron 里面为做：**主进程**。

当我们使用：`electron xxx.js` 启动应用的时候（不打开任何窗口），启动了一个进程，这个进程就是**主进程**。

首先新建一个测试项目：

```bash
mkdir electron-process-test // 新建文件夹 electron-process-test
cd electron-process-test
yarn init
ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/ yarn add electron -D
```

新建主进程文件：`main.js`。

```ts title="main.js"
// main.js
console.log('this is main process');
```

接着运行这个 JS，此处在`package.json`中添加命令：

```ts
{
  ...
  "dev:main": "electron main.js",
  ...
}
```

最后运行 `pnpm run dev:main`， 打出了 'hello'，我们在活动监视器可以看到：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/electron/electron1.png)

上述步骤启动了一个 **Electron 主进程**，即图中的带图标的那个 Electron 进程。他启动了一个额外的辅助进程
Electron helper，是 GPU 处理进程。

### 渲染进程


当我们打开浏览器的一个 Tab 并加载了一个页面，此时页面是运行在一个新的进程中的。这个承载页面的进程，在 Electron 里为：**渲染进程**。

接着上述示例：

```ts title='main.js'
const { app, BrowserWindow } = require('electron');
app.on('ready', () => {
  const win = new BrowserWindow({
     width: 400,
     height: 400
  });
});
```

运行 `pnpm run dev:main`, 查看活动监视器：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/electron/electron2.png)

启动后，我们发现并未新增进程。因为**这个窗口在没有加载页面**（本地 HTML 文件或网页）的时候，不会新增渲染进程。

我们需要加载一个页面：

```ts title='main.js'
const { app, BrowserWindow } = require('electron');
app.on('ready', () => {
  const win = new BrowserWindow({
     width: 400,
     height: 400
  });
  win.loadURL('https://www.baidu.com');
});
```

运行并查看活动监视器：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/electron/electron3.png)

发现多了一个**Electron Helper**，其中有一个新增的，即为加载页面的**渲染进程**。

以上过程，我们直观感受到了什么是**主进程**、**渲染进程**：

* 主进程就是使用 `electron main.js` 的时候，就会开启一个主进程：**Electron**。
* 渲染进程会在新建窗口后，`loadURL` 的时候开启渲染进程：**Electron Helper**。

> `loadURL` 也可以加载一个 HTML，与浏览器的 Tab 类似。

```ts
win.loadURL(`file://${__dirname}/../index.html`);
```

上面讲解了 Electron 主进程和渲染进程的概念。

从上述例子也可以直观感受到：
* 主进程主要和操作系统打交道，比如打开原生窗口，应用菜单等。
* 渲染进程则主要就是指窗口中加载页面运行的进程，可以简单理解为浏览器的 Tab 进程。

与浏览器的网页环境不同的是，在 Electron 的渲染进程环境中，可以使用 Node 的相关能力。

以下有一张图，大家可以直观感受到**可使用**的 API 上的差异。

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/electron/electron4.png)

* 渲染进程和主进程均可以使用 Node，因此 Node 环境在最外层。
* 主进程主要调用与系统相关 API。
* 渲染进程则主要是 Web 上的 API。

:::tip 提示
参考文章：[渲染进程、主进程](https://cameronnokes.com/blog/deep-dive-into-electron's-main-and-renderer-processes/)、[Electron本质](http://jlord.us/essential-electron/)。
:::
