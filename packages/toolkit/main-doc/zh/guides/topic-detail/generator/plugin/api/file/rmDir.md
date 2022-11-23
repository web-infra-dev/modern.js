---
sidebar_position: 10
---

# rmDir

删除文件夹。该方法会递归的删除文件夹下的所有文件。

该方法可用于任何文件类型。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export type ForgedAPI = {
  rmDir: (dirName: string) => Promise<void>;
  ...
};
```

## dirName

需删除的文件夹名称或文件夹路径。
