---
sidebar_position: 2
---

# Project Generator

Modern.js provides `@modern-js/create` as a project generator for Modern.js project creation.

## Use

There is no need to install `@modern-js/create` globally, just execute the tool directly with npx:

```bash
npx @modern-js/create [projectDir]
```

:::info
Use npx to get the latest version of `@modern-js/create` every time.
:::

## Params

### [projectDir]

Project directory name.

When executing the above command, the `projectDir` folder will be created in the current directory by default, and the initialization project will be in this folder. When this parameter is empty, the initialization project will be directly generated in the current directory.

### --version

Get the `@modern-js/create` tool version.

```bash
$ npx @modern-js/create --version

[INFO] @modern-js/create v2.0.0
```

### --lang

Specifies the execution language, supports `zh` and `en`.

By default, `@modern-js/create` will automatically identify the user's system language, choose to use Chinese or English, if the recognition fails or you want to specify the language manually, you can use this parameter.

### -c, --config

Specifies the project default configuration.

By default, `@modern-js/create` will have interaction problems such as language selection and package management tools during execution. When you need to specify these configuration contents in advance, you can pass in this field.

This field is a JSON character string, for example when running a package management tool:

```bash
npx @modern-js/create --config '{"packageManager": "pnpm"}'
```

Specific configuration information viewable [Project Configuration](/docs/guides/topic-detail/generator/config/common).

### --no-need-install

By default, `@modern-js/create` automatically installs dependency after the project is created, use this parameter to ignore the install dependency step.

### --dist-tag <distTag\>

Specifies the generator and Modern.js dependency versions.

A smaller micro-generator will be executed during the execution of `@modern-js/create`, and the version number of the micro-generator that can be executed with this parameter and the version number of the corresponding installation Modern.js related dependencies.

### --registry <registry/>

Execute the npm registry to get the generator and npm packages.

### --debug

Displays debug log information during generator execution.

### --mwa

One-click to create an application engineering solution project.

With this parameter, `@modern-js/create` will create the application project with the configuration default value.

### --module

One-click to create a module engineering solution project.

With this parameter, `@modern-js/create` will create the module project with the configuration default value.

### --monorepo

One-click to create a Monorepo engineering solution project.

With this parameter, `@modern-js/create` will create the Monorepo project with the configuration default value.

### --plugin <plugin\>

Specifies the generator plugin.

Modern.js support the use of the generator plug-in custom Modern.js the default project type or add the project type scenes, the parameter user specifies the customized generator plugin.

For custom generator plugins, please refer to [Development Generator Plugin](/docs/guides/topic-detail/generator/plugin/abstract).

### --generator <generator\>

Specifies the microgenerator.

By default, `@modern-js/create` will execute the microgenerator Modern.js framework build-in. If you need to execute a customized microgenerator, and you need to use the posture of `npx @modern-js/create`, you can use this parameter directly.

For custom microgenerators, please refer to [Develop Microgenerator](/docs/guides/topic-detail/generator/codesmith/introduce).

### --packages <packages\>

A project is created by specifying a specific package version dependency.

If you need to specify a specific package version when creating a project, you can use this parameter. This parameter will lock the package version number in the `package.json` of the project root directory by configuration `pnpm.overrides` (package management tool selects pnpm) or `resolutions`.

The parameter value is a JSON character string.
