---
sidebar_position: 4
---

# Context

By default, generator plugins will export a function that takes `context` as a parameter. During execution, `context` will be automatically injected into the generator plugin.

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
`context` provides two types of APIs, which are used to customize input and define generator plugin lifecycle logic.

:::info
Only some APIs are briefly explained below. For the complete API, please refer to [Generator Plugin API](/guides/topic-detail/generator/plugin/api/context.html).
:::

## Customize Input

Both Modern.js Web App and Npm Module schemes have default input interactions. These APIs can be used to add, modify, hide, and provide default values for these inputs.

For example:

- Add question

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

- Hide question by setting `config`

```ts
context.setDefaultConfig({ langauge: 'ts' });
```

## Lifecycle

Generator plugin provide two lifecycle hooks to define generator plugin behavior:

- `onForged`: Lifecycle after file operations are completed.

- `afterForged`: Lifecycle after the `onForged` hook function is executed.

## `onForged`

Hook function after the Modern.js project scheme generator has completed file operations. It is used to complete file operations in the generator plugin, such as adding template files, overwriting existing files, deleting existing files, etc.

When multiple generator plugins are executed simultaneously for extension type, the `onForged` operations of the corresponding generator plugins will be executed in order according to the declared order.

The `onForged` function takes a callback function as a parameter, with `api` and `input` as arguments.

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

The `api` object provides file operation-related methods supported by generator plugin.

`input` is the current user input, which includes the `--config` parameter definition, the default scheme interaction, and the user input defined by the generator plugin.

When adding a new file template, define the template file in the `templates` directory, and then operate on it through the `api` method above. The generator plugin defaults to operating on files in the `templates` directory, so there is no need to declare the `templates` path.

## `afterForged`

Executed after the `onForged` hook function is completed. It is mainly used to install dependencies, perform git operations, etc.

By default, Modern.js project scheme will install dependencies and initialize Git after completing file operations, and perform git initial submissions, etc. This hook function can be omitted.

For custom generator plugins that also support the `custom` type, which only provides a small number of best practice project configurations, installation of dependencies and Git initialization operations need to be completed in this hook function.

The `afterForged` function also takes a callback function as a parameter, with `api` and `input` as arguments.

```ts
  context.afterForged(
    async (api: AfterForgedAPI, input: Record<string, unknown>) => {
      const { packageManager } = input;
      console.info('packageManager:', packageManager);
      await api.install();
    },
  );
```
