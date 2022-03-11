---
sidebar_position: 2
---

# 主进程注册服务
在前面有这么一段例子：

```ts title="electron/main.ts"
// 主进程
import * as services from './services';
const runtime = new Runtime({
  windowsConfig,
  mainServices: services,
});
```
上述就完成了主进程服务注册过程。

## 注册服务

上述示例，完成了在主进程中的服务注册：
- 将所有期望作为服务提供出去的：函数、对象、变量等全部统一导出。

```ts title='services/index.ts'
export const openWindow = (winName: string) => {
  console.log('open window by name', winName);
};
```

:::info 补充信息
更多信息，请参考[【服务定义与导出】](/docs/guides/features/electron/ipc/regist-services/index)。
:::

- 在实例化 `Runtime` 时候，传递给 `Runtime` 完成服务注册。

```ts title='electron/main.ts'
import * as services from './services';

const runtime = new Runtime({
  windowsConfig,
  mainServices: services,
});
```

## 渲染进程中访问

```ts title="xx/xx.tsx（渲染进程）"
import { callMain } from '@modern-js/runtime/electron-render';
...
callMain('openWindow', 'demo')  // 打开 demo 窗口
```

