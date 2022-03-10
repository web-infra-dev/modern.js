---
sidebar_position: 2
---

# createElement

创建工程元素，只支持应用工程方案。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export enum ActionElement {
  Entry = 'entry',
  Server = 'server',
}
export type ForgedAPI = {
  createElement: (
    element: ActionElement,
    params: Record<string, unknown>,
  ) => Promise<void>;
  ...
};
```

## element

工程元素类型，支持 entry 和 server。

## params

创建元素的其他参数，详细参考[应用 New 命令](/docs/apis/generator/config/mwa#new-%E5%91%BD%E4%BB%A4)。
