---
sidebar_position: 3
---

# readDir

读取文件夹，获取文件列表。

该方法可直接在 context 上获取。

其类型定义为：

```ts
export interface IPluginContext {
  readDir: (dir: string) => Promise<string[]>;
  ...
}
```

## dir

文件夹名称或路径，基于创建的项目的相对路径即可。
