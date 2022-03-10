---
sidebar_position: 3
---

# gitAddAndCommit

提交当前仓库变更。

其类型定义为：

```ts
export type AfterForgedAPI = {
  gitAddAndCommit: (commitMessage: string) => Promise<void>;
  ...
};
```

## commitMessage

提交信息。
