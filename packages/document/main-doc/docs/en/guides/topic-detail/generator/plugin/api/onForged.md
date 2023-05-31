---
sidebar_position: 2
---

# onForged

`onForged` is a lifecycle function used for file operations in generator plugin.

## Types

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

The `onForged` parameter is a callback function with `api` and `input` as parameters, which are used to provide the APIs and current input information provided by the lifecycle function.

## Concepts

### File Types

The generator plugin classifies files into four categories:

- Text files

Files with pure text content that can be processed using [Handlebars](https://handlebarsjs.com/) or [EJS](https://ejs.co/) templates.

- Binary files

Files such as images, audio, and video.

- JSON files

Files in JSON format.

- Text list files

Files composed of lines of text, such as `.gitignore`, `.editorconfig`, and `.npmrc`.

The type definitions for the four types of files are:

```ts
export enum FileType {
  Text = 'text',
  Binary = 'binary',
  Json = 'json',
  TextRaw = 'textRaw',
}
```

## API

The APIs provided by the `api` parameter will be introduced below.

### addFile

Adds a single file.

Parameter types:

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

- `type`: File type.
- `file`: Target file path, relative to the target project directory.
- `template`: Template content, the value of this field can be directly used to render the file. Lower priority than `templateFile`.
- `templateFile`: Template file path, relative to the templates directory.
- `force`: Whether to force overwrite when the target file exists, default is false.
- `data`: Template rendering data.

:::info
Text files are processed using Handlebars by default. If the template file ends with `.ejs`, [EJS](https://ejs.co/) will be used for template rendering.
:::

For example, add the template file `App.tsx.hanlebars` to `src/App.tsx`:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.addFile({
    type: FileType.Text,
    file: `src/App.tsx`,
    templateFile: `App.tsx.handlebars`,
  });
})
```

### addManyFiles

Adds multiple files, usually used to add multiple files to the same target directory.

Parameter types:

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

- `type`: File type.
- `destination`: Target folder, relative path to the target project directory.
- `templateFiles`: Template file list, supporting regular expressions from [globby](https://www.npmjs.com/package/globby).
- `templateBase`: Common path of template files. When using this parameter, the target file will automatically delete this path.
- `fileNameFunc`: Function to rename files. During the file addition process, the file name will be passed to this function in turn, and the renaming can be performed as needed.
- `data`: Template rendering data.

For example, render all files in the `src-ts` directory of the template file to the `src` directory:

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

Update fields in a JSON file.

Parameter types:

```ts
fileName: strings
updateInfo: Record<string, unknown>
```

- `fileName`: JSON file path, relative to the target project path.
- `updateInfo`: Update information. Nested field updates need to be flattened, otherwise the entire update will cause content loss.

For example, update the `name` field of `package.json`:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateJSONFile('package.json', { name: 'new_name' });
})
```

For example, update the version of `react-dom` in `dependencies`:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateJSONFile('package.json', {
    'dependencies.react-dom': '^18',
  });
})
```

### updateTextRawFile

Update the contents of a text list file.

Parameter types:

```ts
fileName: string
update: (content: string[]) => string[]
```

- `fileName`: Text list file path, relative to the target project path.
- `update`: Update function. The parameter is an array divided by `\n` of the current file content, and the return value is also the modified array after modification. `@byted/create` will automatically merge it with `\n` and write it to the source file.

For example, add the `dist` directory to the `.gitinore` file:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateTextRawFile('.gitinore', (content) => [...content, 'dist']);
})
```

### updateModernConfig (not recommended)

In addition to configuring in `modern.config.[tj]s`, Modern.js configuration also supports configuring `modernConfig` in `package.json`. This function is used to update this field.

Parameter types:

```ts
updateInfo: Record<string, any>
```

- `updateInfo`: Update content information. `updateModernConfig` is a package based on `updateJSONFile`, which will automatically update under the `edenxConfig` field. Only the configuration fields under `modernConfig` need to be filled in `updateInfo`.

For example, enable SSR:

```ts
context.onForged(async (api: ForgedAPI, _input: Record<string, unknown>) => {
  await api.updateModernConfig({ 'server.ssr': true });
})
```

### rmFile

Delete files.

Parameter types:

```ts
fileName: string
```

- `fileName`: The path of the file to be deleted, relative to the target project path.

### rmDir

Delete a folder.

Parameter types:

```ts
dirName: string
```

- `dirName`: The path of the folder to be deleted, relative to the target project path.

### addHelper

Add a [custom helper](https://handlebarsjs.com/guide/#custom-helpers) rendered by handlebrs.

Parameter types:

```ts
name: string
fn: Handlebars.HelperDelegate
```

- `name`: Helper function name.
- `fn`: Helper function implementation.

### addPartial

Add a [Partial](https://handlebarsjs.com/guide/partials.html#basic-partials) rendered by Handlebars.

Parameter types:

```ts
name: string
str: Handlebars.Template
```

- `name`: Partial name.
- `str`: Template string of the Partial.

### createElement

Automatically call the `new` command to create project elements.

Parameter types:

```ts
element: ActionElement
params: Record<string, unknown>
```

- `element`: Type of project element, new entry or new custom Web Server source directory.
- `params`: Other parameters corresponding to creating project elements.

### enableFunc

Automatically call the `new` command to enable optional features.

Parameter types:

```ts
func: ActionFunction
params?: Record<string, unknown>
```

- `func`: Name of the feature to enable.
- `params`: Other parameters corresponding to enabling the feature.

:::info
Refer to [Configuration Parameters](/guides/topic-detail/generator/new/config.html) for creating project elements and enabling feature configurations.
:::
