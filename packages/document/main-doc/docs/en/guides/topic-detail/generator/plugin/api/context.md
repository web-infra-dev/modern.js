---
sidebar_position: 1
---

# context

The generator plugin exports a function by default in the `main` file, and the function parameter is `context`. All APIs provided by the generator plugin are provided by this `context`.

## Types

Let's first understand the type definition of `context`:

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

The contents provided by `context` can be mainly divided into three categories:

- Get the information of the current generator execution environment.

- Operate input.

- Generator plugin lifecycle function.


The generator plugin APIs will be introduced from these three categories below.

### Get Information

#### locale

Gets the language of the generator plugin execution environment. `@modern-js/create` provides two languages, `zh` and `en`, which correspond to these two values.

#### isFileExist

Checks whether a file exists. We often need to confirm whether the target project file exists before defining the operation. This API can be used directly for this purpose.

For example, we need to find out if the `package.json` file exists and then do someing:

```ts
const isExist = await context.isFileExist('package.json');
if (isExist) {
    ...
}
```

#### readDir

Gets the file list in a folder. We often need to get the file list under the target project folder before defining the operation. This API can be used directly for this purpose.

For example, we need to get all files under the `src` folder and then do someing:

```ts
const files = await context.readDir('src');

files.map(name => {
    ...
});
```

### Input Operations

The `key` parameter used in input operations can refer to [Configuration Parameters](/guides/topic-detail/generator/create/config.html) and use the key under the solution’s scheme, that is, it does not support `solution` and `scenes`.

The input parameter in input operations corresponds to the schema type described in [Input](/guides/topic-detail/generator/plugin/api/input.html).

#### addInputBefore

Adds a question before the specified input `key`.

For example:

```ts
context.addInputBefore('packageManager', {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: 'Please select the programming language:',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
});
```

#### addInputAfter

Adds a question after the specified input `key`.

For example:

```ts
context.addInputAfter('packageManager', {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      title: 'Please select the programming language:',
      enum: [
        { label: 'TS', value: 'ts' },
        { label: 'ES6+', value: 'js' },
      ],
    },
  },
});
```

:::info
1. The `key` for adding a question cannot be the same as the `key` of the question provided by Modern.js solution scheme itself.
2. The priority of adding a question with `addInputAfter` is higher than that of `addInputBefore`. When adding an After question to a key and adding a Before question to the next key, the After question will be before the Before question.
3. When adding multiple questions before or after the same `key`, this method can be called multiple times, and the order of the questions will be arranged according to the calling sequence.

:::

#### setInput

Sets the attributes of the specified input `key`.

For example, set the `title` attribute of `packageName`:

```ts
context.setInput('packageName', 'title', "Name");
```

:::info
For input options provided by Modern.js solution schemes, only deletion is supported, and adding will cause logical judgment problems in the code.
:::


#### setInputValue

Sets the default value of the specified input `key`.

For example, set the default value of `packageManager`:

```ts
context.setInputValue({
  packageManager: 'npm',
});
```

:::info
After setting, the question still needs to be interactive, but the default value configured by the generator plugin will be used.
:::

#### setDefaultConfig

Sets the default value of the specified input `key`.

For example, set the default value of `packageManager`:

```ts
context.setDefaultConfig({
  packageManager: 'npm',
});
```

:::info
After setting, the corresponding question will no longer be displayed, which is consistent with the `--config` behavior specified by `@modern-js/create`. Does not support setting `vertical` and `projectOrg`.
:::

#### setGitMessage

Sets the initial git commit message. Modern.js defaults to the git initialization commit message as `feat: init`, which can be modified by this function.


### Lifecycle Functions

The lifecycle functions are relatively complex and will be introduced separately in the following two sections, [`onForged`](/api/generator-plugin/onForged.html) and [`afterForged`](/api/generator-plugin/onForged.html).
