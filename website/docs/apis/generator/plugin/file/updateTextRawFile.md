---
sidebar_position: 7
---

# updateTextRawFile

更新文本列表文件内容。

该方法适用与文本列表文件类型。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export type ForgedAPI = {
updateTextRawFile: (
    fileName: string,
    update: (content: string[]) => string[],
  ) => Promise<void>;
  ...
};
```

## fileName

文本列表文件的文件名或者文件路径。

## update

更新函数。

该函数参数为当前文件内容，内容将以 '\n' 分割，以数组的形式传入函数，函数的返回值也是数组，内部将自动以 '\n' 合并，写入源文件。
