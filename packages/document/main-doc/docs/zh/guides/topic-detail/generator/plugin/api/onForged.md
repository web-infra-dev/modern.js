---
sidebar_position: 2
---

# onForged

`onForged` 为生成器插件中用于文件操作的生命周期函数。

## 类型

```ts
export type ForgedAPI = {
  addFile: (params: AddFileParams) => Promise<void>;
  addManyFiles: (params: AddManyFilesParams) => Promise<void>;
  updateJSONFile: (fileName: string, updateInfo: Record<string, unknown>) => Promise<void>;
  updateTextRawFile: (fileName: string, update: (content: string[]) => string[]) => Promise<void>;
  updateModernConfig: (updateInfo: Record<string, any>) => Promise<void>;
  rmFile: (fileName: string) => Promise<void>;
  rmDir: (dirName: string) => Promise<void>;
  addHelper: (name: string, fn: Handlebars.HelperDelegate) => void;
  addPartial: (name: string, str: Handlebars.Template) => void;
  createElement: (element: ActionElement, params: Record<string, unknown>) => Promise<void>;
  enableFunc: (func: ActionFunction, params?: Record<string, unknown> | undefined) => Promise<void>;
};

export type PluginForgedFunc = (
  api: ForgedAPI,
  inputData: Record<string, unknown>,
) => void | Promise<void>;

export interface IPluginContext {
  onForged: (func: PluginForgedFunc) => void;
  ...
}
```

`onForged` 参数为一个回调函数，回调函数参数为 `api` 和 `input`，分别用于提供该生命周期函数提供的 API 及当前输入信息。

## 概念

### 文件类型

生成器插件将文件类型分为撕四类：

- 文本文件

纯文本内容文件，可使用 [Handlebars](https://handlebarsjs.com/) 或 [EJS](https://ejs.co/) 进行模板处理的文件。

- 二进制文件

图片、音频、视频等文件。

- JSON 文件

JSON 格式的文件。

- 文本列表文件

文件由行文本组成的文件，例如 `.gitignore`, `.editorconfig`, `.npmrc`。

对应四种文件的类型定义为：

```ts
export enum FileType {
  Text = 'text',
  Binary = 'binary',
  Json = 'json',
  TextRaw = 'textRaw',
}
```

## API

下面将分别介绍 api 参数提供的 API。

### addFile

添加单个文件。

参数类型：

```ts
export interface AddFileParams {
  type: FileType;
  file: string;
  template?: string;
  templateFile?: string;
  force?: boolean;
  data?: Record<string, string>;
}
```

- `type`： 文件类型。
- `file`：目标文件路径，相对于目标项目目录的相对路径。
- `template`：模板内容，该字段值可直接用于模板渲染文件。优先级低于 `templateFile`。
- `templateFile`：模板文件路径，相对于 templates 目录的相对路径即可。
- `force`：是否强制覆盖，当目标文件存在时是否强制覆盖，默认为 false。
- `data`：模板渲染数据。

:::info
文本类型文件默认使用 Handlebars 进行处理，当模板文件以 `.ejs` 结尾的话，会使用 [EJS](https://ejs.co/) 进行模板渲染。
:::

例如添加模板文件 `App.tsx.hanlebars` 到 `src/App.tsx` 中:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.addFile({
    type: FileType.Text,
    file: `src/App.tsx`,
    templateFile: `App.tsx.handlebars`,
  });
})
```

### addManyFiless

批量添加文件，一般用于添加多个文件到同一个目标目录。

参数类型：

```ts
export interface AddManyFilesParams {
  type: FileType;
  destination: string;
  templateFiles: string[] | (() => string[]);
  templateBase?: string;
  fileNameFunc?: (name: string) => string;
  data?: Record<string, string>;
}
```

- `type`： 文件类型。
- `destination`：目标文件夹，相对于目标项目目录的相对路径。
- `templateFiles`：模板文件列表，支持 [globby](https://www.npmjs.com/package/globby) 正则表达式
- `templateBase`：模板文件的公共路径，使用该参数时目标文件会自动删除该路径。
- `fileNameFunc`：重命名文件函数，添加文件过程中会依次将文件名传入到该函数，可以根据需要进行重命名。
- `data`：模板渲染数据。

例如将模板文件 `src-ts` 目录下所有文件渲染到 `src` 目录：

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.addManyFiles({
    type: FileType.Text,
    destination: 'src',
    templateFiles: ['src-ts/**/*'],
    templateBase: 'src-ts',
    fileNameFunc: name => name.replace('.handlebars', ''),
  });
})
```

### updateJSONFile

更新 JSON 文件字段。

参数类型：

```ts
fileName: strings
updateInfo: Record<string, unknown>
```

- `fileName`：JSON 文件路径，相对于目标项目的路径。
- `updateInfo`：更新信息，嵌套字段更新需要平铺，不然会更新整体造成内容丢失。

例如更新 `package.json` 的 name 字段：

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateJSONFile('package.json', { name: 'new_name' });
})
```

例如更新 `dependencies` 的 `react-dom` 版本:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateJSONFile('package.json', {
    'dependencies.react-dom': '^18',
  });
})
```

### updateTextRawFile

更新文本列表文件内容。

参数类型：

```ts
fileName: string
update: (content: string[]) => string[]
```

- `fileName`： 文本列表文件路径，相对于目标项目的路径。
- `update`：更新函数，参数为当前文件内容以 `\n` 进行分割的数组，返回值也为修改完成后的数组，`@modern-js/create` 会自动以 `\n` 合并，并写入源文件。

例如 `.gitinore` 文件中增加 dist 目录：

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateTextRawFile('.gitinore', (content) => [...content, 'dist']);
})
```

### updateModernConfig(不推荐)

EdenX 配置除了可以在 `modern.config.[tj]s` 中配置外，还支持 `package.json` 中配置 `modernConfig` 配置。该函数用于更新该字段。

参数类型：

```ts
updateInfo: Record<string, any>
```

- `updateInfo`： 更新内容信息。updateModernConfig 是基于 updateJSONFile 的封装，将自动更新到 `modernConfig` 字段下，updateInfo 中只需填写 `modernConfig` 下的配置字段即可。

例如开启 ssr：

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateModernConfig({ 'server.ssr': true });
})
```

### rmFile

删除文件。

参数类型：

```ts
fileName: string
```

- `fileName`：删除的文件路径，相对于目标项目的路径。

### rmDir

删除文件夹。

参数类型：

```ts
dirName: string
```

- `dirName`：删除的文件夹路径，相对于目标项目的路径。

### addHelper

添加 handlebrs 渲染的[自定义 Helper](https://handlebarsjs.com/guide/#custom-helpers)。

参数类型：

```ts
name: string
fn: Handlebars.HelperDelegate
```

- `name`：Helper 函数名称。
- `fn`：Helper 函数实现。

### addPartial

添加 Handlebars 渲染的 [Partial](https://handlebarsjs.com/guide/partials.html#basic-partials)。

参数类型：

```ts
name: string
str: Handlebars.Template
```

- `name`：Partial 名称。
- `str`：Partial 的模板字符串。

### createElement

自动调用 new 命令创建工程元素。

参数类型：

```ts
element: ActionElement
params: Record<string, unknown>
```

- `element`：工程元素类型，新建入口或者新建自定义 Web Server 源码目录。
- `params`：对应创建工程元素的其他参数。

### enableFunc

自动调用 new 命令开启可选功能。

参数类型：

```ts
func: ActionFunction
params?: Record<string, unknown>
```

- `func`：开启功能名称。
- `params`：对应开启功能的其他参数。

:::info
创建工程元素和开启功能配置可参考[配置参数](/guides/topic-detail/generator/new/config.html)。
:::
