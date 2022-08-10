---
sidebar_position: 6
---

# testServices

:::info 补充信息
* 使用进程：[主进程](/docs/guides/features/electron/basic#主进程)。
```ts
import { testServices } from '@modern-js/runtime/electron-test/main';
```
:::

`testServices(services)`
#### 参数
- services：`{ [key: string]: unknown }`，需要被测试的服务。

#### 返回值
- `{ [key: string]: unknown }`，返回传入的 `services`。

被 `testServices` 所包裹的函数，则可被测试框架所测试与使用。

## 示例

```ts
import { testServices } from '@modern-js/electron-test/main';
...
const runtime = new Runtime({
  windowsConfig,
  mainServices: testServices({
    ...services,
    winService,
    updateService,
    lifecycleService
  }),
});
```
