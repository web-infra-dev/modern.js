---
sidebar_position: 5
---

# addManyFile

批量添加文件。用于添加 `templates` 目录的多个文件。

该方法可用于任何文件类型，对于二进制以外的文件类型，添加文件时会进行 Handlebars 渲染。

该方法可在 `onForged` 生命周期的 `api` 参数上获取。

其类型定义为：

```ts
export interface AddManyFilesParams {
  type: FileType;
  destination: string;
  templateFiles: string[] | (() => string[]);
  templateBase?: string;
  fileNameFunc?: (name: string) => string;
  data?: Record<string, string>; // template data
}
export type ForgedAPI = {
  addManyFiles: (params: AddManyFilesParams) => Promise<void>;
  ...
};
```

## type

文件类型，具体可查看[文件类型](/docs/apis/generator/plugin/file/introduce#%E6%96%87%E4%BB%B6%E7%B1%BB%E5%9E%8B)。

## destination

创建的目标文件夹路径。由于是批量添加文件，这里填写需要写入的文件夹路径即可。

## templateFiles

模板文件列表。
该参数支持函数参数，也支持 [globby 正则](https://www.npmjs.com/package/globby)。

## templateBase

模板基础路径。
模板路径通常为同一个目录下的模板文件，如果渲染结果需要去除掉模板文件前缀目录，可使用该字段。
模板渲染文件内容将等于 `templateFiles - templateBase`

## fileNameFunc

重命名文件函数，在该函数中将一次传入渲染的文件名称，可在该函数中进行重命名。

## data

Handlebars 渲染数据。
