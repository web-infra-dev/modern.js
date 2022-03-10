---
sidebar_position: 2
---

# addHelper

针对于文本类型文件，增加 Handlebars 的自定义 Help 函数，具体可查看文档[Custom Helpers](https://handlebarsjs.com/guide/#custom-helpers)。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export type ForgedAPI = {
  addHelper: (name: string, fn: Handlebars.HelperDelegate) => void;
  ...
};
```

## name

help 函数名称。

## fn

help 函数实现。
