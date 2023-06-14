---
sidebar_position: 3
---

# afterForged

`afterForged` 为生成器插件中用于文件操作后其他步骤操作的生命周期函数。

## 类型

```ts
export type AfterForgedAPI = {
  isInGitRepo: () => Promise<boolean>;
  initGitRepo: () => Promise<void>;
  gitAddAndCommit: (commitMessage: string) => Promise<void>;
  install: () => Promise<void>;
};

export type PluginAfterForgedFunc = (api: AfterForgedAPI, inputData: Record<string, unknown>) => Promise<void>;

export interface IPluginContext {
   afterForged: (func: PluginAfterForgedFunc) => void;
  ...
}
```

## API

下面将分别介绍 api 参数提供的 API。

### isInGitRepo

判断当前项目是否为一个 Git 仓库。

### initGitRepo

初始化当前项目为 Git 仓库。

### gitAddAndCommit

提交当前仓库变更。

参数：

- `commitMessage`: commit 信息。


### install

在项目根目录安装依赖。`install` 函数中将根据 `packageManager` 的值使用对应的包管理工具安装依赖。
