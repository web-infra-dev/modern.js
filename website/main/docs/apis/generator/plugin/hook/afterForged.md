---
sidebar_position: 2
---

# AfterForged

afterForged 函数为生成器插件生命周期函数，其通常用于定义安装依赖、Git 等操作，专业些操作将会在 onForged 函数执行完成后进行。

该方法可直接在 context 上获取。

其类型定义为：

```ts
export type PluginAfterForgedFunc = (
  api: AfterForgedAPI,
  inputData: Record<string, unknown>,
) => Promise<void>;

export interface IPluginContext {
  afterForged: (func: PluginAfterForgedFunc) => void;
  ...
}
```

## func

afterForged 参数是一个回调函数，函数参数为 api 和 inputData。

### api

在 afterForged 生命周期中支持的函数列表，具体可查看[Git API](/docs/apis/generator/plugin/git/isInGitRepo) 和[NPM API](/docs/apis/generator/plugin/npm/install)。

### inputData

当前用户输入，可用于获取用户当前的输入信息及配置信息。
