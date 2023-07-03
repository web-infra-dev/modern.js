---
sidebar_position: 2
---

# CLI Options

`@modern-js/create` provides many configuration parameters to configure its behavior during execution, which can be viewed using the `--help` parameter:

```bash
npx @modern-js/create@latest --help

Usage: npx @modern-js/create@latest [projectDir]

create Modern.js solution project

Options:
  --version                show create tools version
  --lang <lang>            set create tools language(en or zh)
  -c, --config <config>    set default project config(json string) (default: "{}")
  -d,--debug               using debug mode to log something (default: false)
  --mwa                    create mwa application using default config (default: false)
  --module                 create module application using default config (default: false)
  --monorepo               create monorepo application using default config (default: false)
  --generator <generator>  run custom generator
  -p, --plugin <plugin>    use generator plugin to create new solution or customize Modern.js solution (default: [])
  --dist-tag <distTag>     use specified tag version for it\'s generator (default: "")
  --packages <packages>    set project specific dependency version information (default: "{}")
  --registry <registry>    set npm registry url to run npm command (default: "")
  --no-need-install        not run install command
  -h, --help               display help for command

Commands:
  clean-cache              clean locale generator cache
```

The following will provide a detailed introduction to these parameters:

## [projectDir]

The project directory name.

When executing `@modern-js/create`, a `projectDir` folder will be created in the current directory by default, and the project will be initialized in this folder. If this parameter is empty, the initialization project will be directly generated in the current directory.

:::info
If the contents of the directory where `projectDir` is located are not empty, a prompt will be given whether to continue creating. It is recommended to perform project initialization operations in an empty directory.
:::

## --version

Get the version of the `@modern-js/create` tool.

```bash
npx @modern-js/create@latest --version

[INFO] @modern-js/create v2.21.1
```

## --lang \<lang>

The execution language, supports `zh` and `en`.

By default, `@modern-js/create` will automatically identify the user's system language and choose to use Chinese or English. If the identification fails or does not meet usage habits, you can manually specify it using this parameter.

## -c, --config \<config>

Specify the default project configuration.

By default, `@modern-js/create` will prompt for interactive questions such as language selection and package managers during the execution process. When it is necessary to specify these configuration contents in advance, they can be passed in through this field.

This field is a JSON string. For example, when specifying a package manager:

```bash
npx @modern-js/create@latest --config '{"packageManager": "pnpm"}'
```

Supported parameters for `config` can be found at [Configuration Parameters](/guides/topic-detail/generator/create/config.html)。

## -d,--debug

Display debug logs.

When encountering problems during use, you can use this parameter to display debug logs, which is convenient for quickly locating the problem position and troubleshooting.

## --mwa

Quickly create a Web App project.

## --module

Quickly create a Npm Module project.

## --monorepo

Quickly create a Monorepo project.

## -p, --plugin \<plugin>

Specify a generator plugin.

`@modern-js/create` supports customizing the default project solution type of Modern.js or adding project solution type scenarios using generator plugin. For details, please refer to [Developing Generator Plugin](/guides/topic-detail/generator/plugin/structure.html).

## --generator \<generator>

Specify a micro-generator.

<!-- TODO 详情可查看[开发微生成器]-->
`@modern-js/create` supports completely customizing the project generation process using micro-generator.

## --dist-tag \<distTag>

Specify the version of the generator and Modern.js-related dependencies.

During the execution of `@modern-js/create`, a smaller micro-generator will be executed by default, and the `latest` version of the micro-generator will be used by default. This parameter can be used to specify the version number of the micro-generator to be executed and the version of the installed Modern.js-related dependencies.

For example, use the `next` version:

```bash
npx @modern-js/create@next --dist-tag next
```

## --packages \<packages>

Specify specific package version dependencies when creating a project.

If you need to specify a specific package version when creating a project, you can use this parameter. This parameter will configure `pnpm.overrides` (if the package manager is pnpm) or `resolutions` to lock the package version number in the `package.json` file in the project root directory.

The parameter value is a JSON string.

For example, specify the react version:

```bash
npx @modern-js/create@latest --packages '{"react":"^17"}'
```

## --registry \<registry>

Specify the sub-generator to execute and the npm registry to fetch project dependencies version.

## --no-need-install

Ignore automatic installation of dependencies.

By default, `@modern-js/create` will automatically install dependencies after creating a project. Using this parameter can ignore the installation of dependencies.

## clean-cache

The `@modern-js/create` command generates sub-generators cache in the tmp directory of the execution machine by default to speed up the generator execution. This command can be used to delete the cache when it needs to be refreshed or when there are problems with the cache.

```bash
npx @modern-js/create@latest clean-cache
```
