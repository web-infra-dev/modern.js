---
sidebar_position: 1
---

# Usage

In Web App, Npm Module and Monorepo projects, we provide the `new` command to create project elements, enable features and create sub-project.

## Web App

Web App projects use the `new` command provided by `@modern-js/app-tools`.


The `new` command provides three types of operations:

- Create project elements

- Enable optional features

- Automatic refactoring

Each type of operation provides a corresponding list of supported options, which can be selected based on the project situation.

For example:

Create a new application entry:

```bash
npm run new
? Please select the operation you want: Create Element
? Please select the type of element to create: New "entry"
? Please fill in the entry name: entry
```

After running, a new folder with the corresponding name of the entry will be created in the `src` directory of the project, along with the default entry file. The previous entry files under the `src` directory will be sorted into the folder corresponding to the `name` field in `package.json`.

Enable BFF function:

```bash
npm run new
? Please select the operation you want: Enable Features
? Please select the feature name: Enable BFF
? Please select the BFF type: Function
? Please select the framework: Express
```

After running, BFF-related dependencies will be installed in the project, and an `api` directory will be created for BFF module development, along with prompt information for registering BFF plugins.

:::info
We did not automatically register the plugin for the user here because the `modern.config.[tj]s` may change during the project lifecycle, and there may be problems with mutual references between modules, so allowing the user to manually register can ensure the correctness of modifying the configuration.

In subsequent customized development, if there are similar needs, you can also provide users with operational guidance through prompts, allowing users to manually operate on files.
:::

:::warning
When running the `new` command, it may be necessary to enable a feature that is not in the list. Check whether the corresponding plugin for the feature has been installed in the `package.json` file of the project. If you still need to use the `new` command to enable it, you need to manually remove the plugin dependency first.
:::

## Npm Module

Npm Module projects use the `new` command provided by `@modern-js/module-tools`.

The `new` command provides the ability to enable optional features.

For example:

Enable Storybook capability:

```bash
npm run new
? Please select the operation you want: Enable Features
? Please select the feature name: Enable Storybook
```

After running, Storybook plugin dependencies will be installed in the project, and the `storybook` command will be added. A `stories` directory will be created for Storybook module development, along with prompt information for registering Storybook plugins.

## Monorepo

Monorepo projects use the `new` command provided by `@modern-js/monorepo-tools`.

The `new` command provides the ability to create sub-project.

For example:

Create Web App Sub-project:

```bash
? Please select the type of project you want to create: Web App
? Please fill in the sub-project name: web_app
? Please fill in the sub-project directory name: web_app
? Please select the programming language: TS
? Please select the bundler: webpack
```

After running, a sub-project named `web_app` will be created in the `apps` directory of the project. In the sub-project directory, you can still run the `new` command to create project elements and enable features.
