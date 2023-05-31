---
sidebar_position: 1
---

# context

生成器插件在 `main` 文件中默认导出了一个函数，函数参数为 `context`，生成器插件提供的所有 API 都是由这个 `context` 提供的。

## 类型

我们先大概了解一下 `context` 的类型定义：

```ts
export interface IPluginContext {
  locale?: string;
  addInputBefore: (key: string, input: Schema) => void;
  addInputAfter: (key: string, input: Schema) => void;
  setInput: (key: string, field: string, value: unknown) => void;
  setInputValue: (value: Record<string, unknown>) => void;
  setDefaultConfig: (value: Record<string, unknown>) => void;
  isFileExist: (fileName: string) => Promise<boolean>;
  readDir: (dir: string) => Promise<string[]>;
  setGitMessage: (gitMessage: string) => void;
  onForged: (func: PluginForgedFunc) => void;
  afterForged: (func: PluginAfterForgedFunc) => void;
}
```

`context` 提供的内容主要分为三类：

- 获取当前生成器执行环境信息

- 操作 input 输入

- 生成器插件生命周期函数

下面将从这三个分类分别介绍生成器插件 API。


### 获取信息

#### locale

获取生成器插件执行环境的语言。`@modern-js/create` 提供了 `zh` 和 `en` 两种语言，这里即为对应的这两种值。

#### isFileExist

判断文件是否存在。我们很多时候需要在定义操作前确认目标项目文件是否已经存在，可以直接通过该 API 获取。

例如我们需要获取 `package.json` 文件是否存在，然后做相应的操作：

```ts
const isExist = await context.isFileExist('package.json');
if (isExist) {
    ...
}
```

#### readDir

获取文件夹内文件列表。我们很多时候需要在定义操作前获取目标项目文件夹下面文件列表，可以直接通过该 API 获取。

例如我们需要获取 src 文件夹下所有文件，然后进行相应操作：

```ts
const files = await context.readDir('src');

files.map(name => {
    ...
});
```

### input 操作

input 操作中使用的 key 参数可参考[配置参数](/guides/topic-detail/generator/create/config.html)，需要在使用对应工程方案下的 key，即不支持在 `vertical` 和 `projectOrg`。

input 操作中的 input 参数对应的 Schema 类型可参考 [Input](/guides/topic-detail/generator/plugin/api/input.html)。

#### addInputBefore

在指定的 input `key` 前添加问题。

例如：

```ts
context.addInputBefore('packageManager', {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: '开发语言',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
});
```

### addInputAfter

在指定的 input `key` 后添加问题。

例如：

```ts
context.addInputAfter('packageManager', {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: '开发语言',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
});
```

:::info
1. 添加问题的 `key` 不能和 EdenX 提供的工程方案自身的问题的 `key` 重复。
2. 添加问题 `addInputAfter` 的优先级高于 `addInputBefore`，当同时对一个 key 添加 After 问题和对其后一个key 添加 Before 问题时，After 问题会在 Before 之前。
3. 当需要在相同 `key` 前面或者后面添加多个问题时，可多次调用该方法，问题的顺序会按照调用顺序进行排列。

:::

#### setInput

设置指定 input `key` 的属性。

例如设置 `packageName` 的 `title` 属性：

```ts
context.setInput('packageName', 'title', "展示名称");
```

:::info
对于 EdenX 工程方案提供的输入选项，只支持删除，不支持增加，增加会造成代码中的逻辑判断存在问题。
:::


#### setInputValue

设置指定 input `key` 的选项默认值。

例如设置 `packageManager` 的默认值：

```ts
context.setInputValue({
  packageManager: 'npm',
});
```

:::info
设置完成后，该问题还是需要交互，只是会使用生成器插件配置的默认值。
:::

#### setDefaultConfig

设置指定 input `key` 的默认值。

例如设置 `packageManager` 的默认值：

```ts
context.setDefaultConfig({
  packageManager: 'npm',
});
```

:::info
设置完成后，将不再展示对应问题，和 `@modern-js/create` 制定 `--config` 行为一致。不支持设置 `vertical` 和 `projectOrg`。
:::

#### setGitMessage

设置 Git 初始提交信息。EdenX 默认 Git 初始化提交信息为 `feat: init`，通过该函数可以修改。


### 生命周期函数

生命周期函数比较复杂，将通过后面两节 [`onForged`](/guides/topic-detail/generator/plugin/api/onForged.html) 和 [`afterForged`](/guides/topic-detail/generator/plugin/api/afterForged.html) 分别介绍。
