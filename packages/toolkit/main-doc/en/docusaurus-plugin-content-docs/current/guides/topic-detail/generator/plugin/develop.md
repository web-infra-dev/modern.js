---
sidebar_position: 3
---

# How to develop generator plugins

## Create project

Modern.js provides a generator plugin to create a generator plugin project, you can directly execute the following command to create:

```bash
npx @modern-js/create plugin --plugin @modern-js/generator-plugin-plugin
```

Different plugin types will ask different questions. You can choose the plugin type according to your needs.

### Extension type

```
? Please select the solution you want to create Module Solution
? Please select the scene you want to create 生成器插件
? Plugin Package Name plugin
? Development Language TS
? Package Management Tool pnpm
? Plugin Type extend
? Plugin Base Type MWA Solution
```

### Customized type

```
? Plugin Package Name plugin
? Development Language TS
? Package Management Tool pnpm
? Plugin Type custom
? Plugin Key mobile-app
? Plugin Show Name Mobile App
? Plugin Base Type MWA Solution
```

After the execution of the create project command is completed, a project for developing the generator plugin will be generated accordingly, and the `meta` information will also be generated according to your selection in the `package.json`.

:::info
For generator plugin development, please refer to  `@modern-js/generator-plugin-plugin`. [Source Code](https://github.com/modern-js-dev/modern.js/tree/main/packages/generator/plugins/generator-plugin)
:::

## Develop plugin logic

Complete plugin logic development in `src/index.ts`.

The plugin exports a function by default, the function parameter is `context`, and some methods are provided on `context` to directly operate on the current project.


A brief introduction to the provided methods, the complete API list viewable [Generator Plugin API](/docs/guides/topic-detail/generator/plugin/api/introduce).

### Customize input

- addInputBefore

Add input before the default input, such as adding questions before the `Select package management tool` question.

Specific Modern.js configuration viewable for each problem [Project Solution Configuration](/docs/guides/topic-detail/generator/config/common).

```ts
context.addInputBefore('input2', {
  type: 'object',
  properties: {
    'input1.2': {
      type: 'string',
      title: 'input1.2',
    },
  },
});
```

- setInput

Set attributes of existing problems.

```ts
context.setInput('test', 'type', 'number')
context.setInput('test', 'enum', [{ value: 'option1', label: '选项一' }])
```

### onForged

After the implementation of the hook related operations of the project plan type file is completed, multiple extended inspection will execute its `onForged` function in sequence according to the `plugin` parameter order.

The `onForged` parameter is a callback function, and the function parameters are `api` and `input`.

Some file manipulation related methods are provided on the `api`, which can operate on the current template file in this hook.

`input` is the current user input, which can be used to obtain the current input information and configuration information of the user.

When you need a new template file, you can add it directly in the `templates` directory. In the `onForged` function, you can directly operate the `templates` directory file. For example, the `templateFile` parameter in the `addFile` below is the file in the `templates` directory. There is no need to display the declaration `templates` here, just write the relative path relative to `templates`.

API functions supported in `onForged` can also be found in [Generator Plugin API](/docs/guides/topic-detail/generator/plugin/api/hook/onForged).

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

### afterForged

After the `onForged` function is executed, it can mainly install dependencies, Git operations, etc.

If your project plan is based on the three projects provided by the Modern.js, this hook function may not be required. The default project plan will automatically include the installation dependency and commit code logic.

The generator plugin also supports a customized `custom` type, which only provides a small amount of development-level best practice code, such as `.gitignore`, `editorConfig` and other files. In this case, you need to manually supplement the installation dependency and Git operation logic in the `afterForged` function.

The `afterForged` parameter is also a callback function, and the function parameters are `api` and `input`.

The `api` will provide some npm, Git and other methods, which can install dependency and Git operations in this hook.

`input` is the current user input, which can be used to obtain the current input information and configuration information of the user.

The API functions supported in `afterForged` can also be found in [Generator Plugin API] (/docs/guides/topic-detail/generator/plugin/api/hook/afterForged).
