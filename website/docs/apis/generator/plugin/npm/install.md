---
sidebar_position: 1
---

# install

在项目根目录安装依赖。

install 函数中将根据 packageManager 的值使用对应的包管理工具安装依赖。

```ts
export type AfterForgedAPI = {
  install: () => Promise<void>;
  ...
};
```
