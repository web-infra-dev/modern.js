---
sidebar_position: 3
---

# callMain

:::info 补充信息
* 使用进程：[渲染进程](/docs/guides/features/electron/basic#渲染进程)。

```ts
import { callMain } from '@modern-js/runtime/electron-render';
```
:::

`callMain(funcName[,...args])`

#### 参数
- funcName：`string`，执行主进程函数名。
- [args]：`any[]`，执行主进程函数参数。
#### 返回值
- `Promise<any>`，返回执行结果。


渲染进程通信了主进程，让其执行 `funcName` 函数，并可以通过 Promise 获取执行结果。
