---
sidebar_position: 1
---

# isInGitRepo

判断当前项目是否为一个 Git 仓库。

其类型定义为：

```ts
export type AfterForgedAPI = {
  isInGitRepo: () => Promise<boolean>;
  ...
};
```
