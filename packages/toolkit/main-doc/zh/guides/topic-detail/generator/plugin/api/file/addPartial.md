---
sidebar_position: 3
---

# addPartial

针对于文本类型文件，增加 Handlebars 的自定义 Partial 片段，具体可查看文档[Partials](https://handlebarsjs.com/guide/#partials)。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export type ForgedAPI = {
  addPartial: (name: string, str: Handlebars.Template) => void;
  ...
};
```

## name

partial名称。

## str

partial 模板字符串。
