---
sidebar_position: 1
---

# @modern-js/codesmith-api-app

The combination encapsulation of APIs commonly used in the development of microgenerators, including APIs encapsulation of other packages such as fs, git, npm, etc. When the requirements can be met, it is recommended to use the API of the npm package.

## Use

```ts
import { AppAPI } from '@modern-js/codesmith-api-app';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  await appApi.runInstall();
};
```

- Create AppAPI instance, the parameter is the generator of the microgenerator function parameter, please see the composition of the microgenerator project for details.
- Just call the API on its example.

## API

### checkEnvironment

Check the current generator operating environment, the check items are:

1. The node and node versions, the default is greater than 12.22.12, and the node version can be executed by passing parameters.
2. Yarn, pnpm or npm can be used.

Parameter:

- nodeVersion?: `string`. Node version want to check.

### runInstall

To install dependency, you can pass in the install dependency command, which defaults to the `packageManager` value in config.

Parameter:

- command?: `string`, Install dependency command.

### runGitAndInstall

This function performs the following actions:

1. Check whether the current generator execution directory is a git repository.
2. If not a git repository, initialization is a git repository.
3. Install dependencies.
4. Commit the initial commit in a non-monorepo project (judging the condition, `isMonorepoSubProject` does not exist or is false in the config), the commit information is feat: init, and customize is supported.

Parameter:

- commitMessage?: `string`, Initialization commit message
- installFunc?: `() => Promise<void>`. Install dependency function

### forgeTemplate

Render generator template file.

Parameter:

- templatePattern: `string`. Template files match regularities,for example: `templates/base-templates/**/*` .
- filter?: `(resourceKey: string) => boolean`. Filter function, the parameter is the file path matching the `templatePattern`, return true to render the file, return false to render the file.
- rename?: `(resourceKey: string) => string`. Rename function, the parameter is the file path matching `templatePattern`, and the new filename is returned. The templates directory at the beginning of `resourceKey` and the `.handlebars` suffix at the end will be replaced by default.
- parameters?: `Record<string, any>`. Render parameter, when there is a handlebars or ejs variable in the template, use it to pass the corresponding variable value.
- type?: `'handlebars' | 'ejs'`. Template file type, defaults to handlebars.

For example:

```ts
await appApi.forgeTemplate(
  'templates/base-templates/**/*',
  undefined,
  resourceKey =>
    resourceKey
      .replace('templates/base-templates/', '')
      .replace('.handlebars', ''),
);

await appApi.forgeTemplate(
  'templates/base-template/**/*',
  resourceKey => !resourceKey.include('eslintrc.json'),
  resourceKey =>
    resourceKey
      .replace('templates/base-template/', projectPath)
      .replace('language', language as string)
      .replace('.handlebars', ''),
  {
    name: packageName as string,
    language,
    isTs: language === Language.TS,
    packageManager: getPackageManagerText(packageManager as any),
  },
);
```

### showSuccessInfo

Display success information.

Parameter:

- successInfo?: `string`. Default is Success.

### runSubGenerator

Run the subgenerator.

Parameter:

- subGenerator: `string`. Subgenerator name or path.
- relativePwdPath?: `string`. The relative path to which the'string 'subgenerator runs.
- config?: `Record<string, unknown>`. Default config configuration for subgenerator runs.

For example:

```ts
await appApi.runSubGenerator(
  getGeneratorPath('@modern-js/repo-generator', context.config.distTag),
  undefined,
  { ...context.config, hasPlugin: false },
);
```

### getInputBySchema

User interaction input is done through schema.

Parameter:

- schema: `FormilySchema | Question[]`. Question list, supports Formily schema and inquirer types.
- type: `'formily' | 'inquirer'`. Schema type, the default value is formily.
- configValue: `Record<string, unknown> = {}`. Schema default value, the problem corresponding to the schema field passed in this value will no longer interact with the user.
- validateMap?: `Record<string, (input: unknown, data?: Record<string, unknown>) => { success: boolean; error?: string }>`. Validation function for special fields in schema.
- initValue?: `Record<string, any>`. Schema the initialization value of the field.

For Formily Schema type support, please refer to [Customize input related type definition](/docs/guides/topic-detail/generator/plugin/api/input/type).

### getInputBySchemaFunc

By schema to complete user interaction input, schema parameter value as function, the user handles globalization problems, and only supports Formily schema.

Parameter:

- schema: `config?: Record<string, any>) => FormilySchema`. Get the problem list function, the config parameter is the config configuration information in the current generator.
- configValue: `Record<string, unknown> = {}`. Schema default value, the problem corresponding to the schema field passed in this value will no longer interact with the user.
- validateMap?: `Record<string, (input: unknown, data?: Record<string, unknown>) => { success: boolean; error?: string }>`. Validation function for special fields in schema.
- initValue?: `Record<string, any>`. Schema the initialization value of the field.

For Formily Schema type support, please refer to [Customize input related type definition](/docs/guides/topic-detail/generator/plugin/api/input/type).
