---
sidebar_position: 1
---

# OnForged

onForged 函数为生成器插件生命周期函数，其通常用于定义文件类型操作，这些操作将在 base 的工程方案文件操作完成后进行。

该方法可直接在 context 上获取。

其类型定义为：

```ts
export type PluginForgedFunc = (
  api: ForgedAPI,
  inputData: Record<string, unknown>,
) => void | Promise<void>;

export interface IPluginContext {
  onForged: (func: PluginForgedFunc) => void;
  ...
}
```

## func

onForged 参数是一个回调函数，函数参数为 api 和 inputData。

### api

在 onForged 生命周期中支持的函数列表，具体可查看[文件操作 API](/docs/apis/generator/plugin/file/introduce) 和[启用功能 API](/docs/apis/generator/plugin/new/introduce)。

### inputData

当前用户输入，可用于获取用户当前的输入信息及配置信息。
