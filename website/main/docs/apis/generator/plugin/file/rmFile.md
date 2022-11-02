---
sidebar_position: 9
---

# rmFile

删除文件。

该方法可用于任何文件类型。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export type ForgedAPI = {
  rmFile: (fileName: string) => Promise<void>;
  ...
};
```

## fileName

需删除的文件名称或文件路径。
