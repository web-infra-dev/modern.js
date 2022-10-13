---
sidebar_position: 1
---

# 介绍
在 Electron 开发中，我们将**双向通信**的场景服务化。这样做帮助我们：
- 将通信场景抽象服务化，减少重复设计实现成本，降低使用复杂度，提高代码可维护性。

我们可以将不同进程所使用的服务放在对应进程的一个目录中统一导出。比如在主进程中，我们可以放在 `electron/services`，并创建 `index.ts` 进行统一导出。

:::info 补充信息
通常，会有如下这些双向通信场景：
* 在**主进程**里期望让**渲染进程**做一件事情，并返回结果。
* 在**渲染进程**里期望让**主进程**做一件事情，并返回结果。
* 在**窗口 A **里期望让**窗口 B **做一件事情，并返回结果。
* 在 **webview 进程**里期望让对应的**父窗口渲染进程**中做一件事情，并返回结果。
* 在**父窗口渲染进程**中，期望让 **webview 进程**做一件事情，并返回结果。
:::
## 服务的导出类型与访问
:::tip 提示
服务导出类型可以是：**函数**、**对象**、**类**、**变量**、**Namespace**。
:::

### 导出变量
> 目前这种场景使用的较少，可以了解下。

```ts title="electron/services/index.ts（主进程）"
export const a = 1;
export const b = {
  a: 1,
};
```
- 主进程中定义的服务，渲染进程中访问方式。

```ts title="xx/xx.tsx（渲染进程）"

import { callMain } from '@modern-js/runtime/electron-render';
...
callMain('a') // 访问 a
callMain('b.a') // 访问 b 对象中的 a

```
- 渲染进程中（main 窗口）定义服务，主进程访问。

```ts title="electron/services/index.ts（主进程中）"
// 主进程中
import { winService } from '@modern-js/runtime/electron-main';
...

export const testCall = () => {
  // return winService.callBrowserWindow('main', 'a.b');
  return winService.callBrowserWindow('main', 'a');
}
```

- 渲染进程中（main 窗口）定义服务，webview 访问。


```ts title="xxx/xx.tsx（webview 进程中）"
// webview 进程中
import webviewBridge from '@modern-js/runtime/electron-webview';

...
webviewBridge.callBrowserWindow('main', 'a');
webviewBridge.callBrowserWindow('main', 'a.b');
```

:::info 补充信息
- 一般在渲染进程中，给主进程提供的服务和给 webview 提供的服务内容是不一样的，方式也不一样：
  - 给主进程提供的服务，是通过`winService.registServices`提供。
  - 给 webview 提供的服务，是通过`webviewService.registServices`提供。
- 在 webview 中**访问渲染进程的服务**的时候有两种方式：
  - 窗口中关闭 Node 后，通过如下方式调用：`callBrowserWindow`。

  ```ts title='xxx/xx.tsx（webview 进程中）'
  import { webviewPreloadApis } from '@modern-js/runtime/electron-webview';
  const { callBrowserWindow } = webviewPreloadApis;
  ```

  - 窗口中开启 Node 后，通过上面示例方式调用：`callBrowserWindow`。

  ```ts title='xxx/xx.tsx（webview 进程中）'
    import webviewBridge from '@modern-js/runtime/electron-webview';
    ...
    webviewBridge.callBrowserWindow('main', 'a');
  ```
:::

### 导出函数

这种场景使用的较多，以**主进程注册服务，供渲染进程访问**为例子：


```ts title='electron/services/index.ts（主进程中）'

// 主进程里的 services (比如：electron/services/index.ts（主进程）)
export const openWindow = (winName: string) => {
  console.log('open window by name', winName);
};

export const closeWindow = (winName: string) => {
 console.log('close window by name', winName);
};
```

渲染进程中访问:

```ts title="xx/xxx.tsx"
import { callMain } from '@modern-js/runtime/electron-render';
...
callMain('openWindow', 'demo')  // 打开 demo 窗口
callMain('closeWindow', 'demo') // 关闭 demo 的窗口

```

:::info 补充信息
其他场景服务访问的方式请参考第一个示例。
:::

### 导出对象

我们可以导出一个对象，后续开发中，调用的是对象的方法，这样的一个好处就是。

- 避免导出的方法重名。
- 代码组织上更加明确，不同的模块区分明显。

基于上面导出函数的示例，我们发现在调用的时候是这样的：

```ts title="xx/xxx.tsx"
callMain('openWindow', 'demo')  // 打开 demo 窗口
callMain('closeWindow', 1) // 关闭 id 为 1 的窗口
```

我们换成对象的形式：



```ts title="electron/services/index.ts（主进程）"
// 主进程里的 services (比如：electron/services/index.ts（主进程）)
import { winService } from '@modern-js/runtime/electron-main';

class WindowManager {
  async openWindow(winName: string) {
    const window = winService.createWindow({
      name: winName,
    });
    return window.ready();
  }

  closeWindow(winName: string) {
    return winService.closeWindowByName(winName);
  }
}

export const winManager = new WindowManager();
```
这时候，我们可以在渲染进程中这样访问：

```ts title='xxx/xx.tsx'
callMain('winManager.openWindow', 'demo')  // 打开 demo 窗口
callMain('winManager.closeWindow', 'demo') // 关闭 demo 的窗口
```

这样对于代码管理和代码调用也更友好。

### 导出命名空间

基于函数形式的内容，我们封装一层命名空间如下：


```ts title='electron/services/index.ts（主进程）'
import { winService } from '@modern-js/runtime/electron-main';
export namespace winManager {
  export const openWindow = (winName: string) => {
    const window = winService.createWindow({
      name: winName,
    });
    return window.ready();
  };

  export const closeWindow = (winName: string) => {
    return winService.closeWindowByName(winName);
  };
}
```

这时候，我们可以在渲染进程中这样访问，与对象相似：

```ts title='xx/xxx.tsx（渲染进程）'
callMain('winManager.openWindow', 'demo')  // 打开 demo 窗口
callMain('winManager.closeWindow', 'demo') // 关闭 demo 的窗口
```
