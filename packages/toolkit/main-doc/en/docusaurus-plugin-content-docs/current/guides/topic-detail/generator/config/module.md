---
sidebar_position: 3
---

# Module

## Project creation

When creating a project, the configuration used by `@modern-js/create` when using the `--config` parameter, and the configuration used when modifying and adding input in the generator plugin.

The application project creation parameters are [Generator Configuration](/docs/guides/topic-detail/generator/config/common).

### packageName

Package name (packageName), character string type.

## New Command

The new command configuration in the module project can be used through the `--config` parameter configuration when executing the new command, or when enabling functions in the generator plugin.

### actionType

The action type (actionType) of the New command, he type supports one:

- function: enable function

:::info
This parameter is not required when using the enable function and creating elements in the generator plugin, it is automatically added in the generator plugin.
:::

### function

Optional function name (function), supports the following options:

- Tailwind CSS(tailwindcss)

- Storybook(mwa_storybook)

- Runtime API(runtimeApi)

- Test(test)
