---
sidebar_position: 4
---

# addFile

添加单个文件。用于添加 `templates` 目录的单个模板文件或者直接使用模板添加到模板文件。

该方法可用于任何文件类型，对于二进制以外的文件类型，添加文件时会进行 Handlebars 渲染。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export interface AddFileParams {
  type: FileType;
  file: string;
  template?: string;
  templateFile?: string;
  force?: boolean;
  data?: Record<string, string>;
}
export type ForgedAPI = {
  addFile: (params: AddFileParams) => Promise<void>;
  ...
};
```

## type

文件类型，具体可查看[文件类型](/docs/apis/generator/plugin/file/introduce#%E6%96%87%E4%BB%B6%E7%B1%BB%E5%9E%8B)。

## file

创建的目标文件路径。

## template

文件模板，配置该字段值可直接用于模板渲染文件。优先级低于 templateFile。

## templateFile

模板文件，用于渲染的模板文件路径，其值为 `templates` 的相对路径即可。

## force

是否强制覆盖，当添加的文件已存在时，默认会冲突报错，设置该值为 true 时，可强制覆盖。

## data

Handlebars 渲染数据。
