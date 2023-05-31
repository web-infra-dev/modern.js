---
sidebar_position: 4
---

# Context

生成器插件默认会导出一个函数，函数参数为 `context`，在执行过程中 `context` 会自动注入到生成器插件中。

```ts title="src/index.ts"
import { IPluginContext, ForgedAPI } from '@modern-js/generator-plugin';

export default function (context: IPluginContext) {
  context.onForged(async (_api: ForgedAPI, _input: Record<string, unknown>) => {
    /**
     * Todo
     */
  });
}
```

`context` 提供了两类 API，分别用于自定义 Input 和定义生成器插件声明周期逻辑。

:::info
下面只对部分 API 做简单示例讲解，完整的 API 请移步 [生成器插件 API](/guides/topic-detail/generator/plugin/api/context.html) 查看。
:::

## 自定义 Input

EdenX 应用和模块工程方案都存在一些默认的 Input 交互，使用这里的 API 可以对这些 Input 进行添加、修改、隐藏、提供默认值等操作。

例如：

- 添加问题

```ts
context.addInputBefore('packageManager', {
  type: 'object',
  properties: {
    'username': {
      type: 'string',
      title: '用户名',
    },
  },
});
```

- 通过设置 config 隐藏问题

```ts
context.setDefaultConfig({ langauge: 'ts' });
```

## 生命周期

生成器插件提供了两个生命周期钩子函数用于定义生成器插件行为：

- onForged：完成文件操作后的生命周期。

- afterForged：onForged 钩子函数执行完成后的生命周期。

## onForged

在 EdenX 工程方案生成器完成文件操作之后的钩子函数，用于完成生成器插件中的文件操作，比如添加模板文件，覆盖现有文件，删除现有文件等。

对于扩展类型同时执行多个生成器插件时，将会按照声明顺序依次执行对应生成器插件的 `onForged` 操作。

`onForged` 函数参数为一个回调函数，参数为 `api` 和 `input`。

```ts
context.onForged(async (api: ForgedAPI, input: Record<string, unknown>) => {
  const { language } = input;
  api.addFile({
      type: FileType.Text,
      file: `src/index.${language as string}`,
      templateFile: `index.${language as string}.handlebars`,
      force: true,
  });
})
```

`api` 上会提供生成器插件支持的文件操作相关方法。

`input` 为当前用户输入内容，包含 `--config` 参数定义的，默认工程方案交互的及生成器插件定义的用户输入。

当需要添加新的文件模板时，将模板文件定义到 `templates` 目录，然后通过上述 `api` 上方法进行操作即可，生成器插件默认对 `templates` 目录文件进行操作，无需再声明 `templates` 路径。

## afterForged

`onForged` 钩子函数执行完成后执行，这里主要用于进行安装依赖，Git 操作等。

默认 EdenX 的工程方案在完成文件操作后会默认执行安装依赖及 Git 初始化，Git 初次提交等，该钩子函数可以不使用。

对于自定义的生成器插件还支持 custom 类型，该类型只提供了少量最佳实践的项目配置，则需要在该钩子函数中完成安装依赖和 Git 初始化等操作。

`afterForged` 函数参数也为一个回调函数，参数为 `api` 和 `input`。

```ts
  context.afterForged(
    async (api: AfterForgedAPI, input: Record<string, unknown>) => {
      const { packageManager } = input;
      console.info('packageManager:', packageManager);
      await api.install();
    },
  );
```
