---
sidebar_position: 2
---

# MWA

## Project creation

When creating a project, the configuration used by `@modern-js/create` when using the `--config` parameter, and the configuration used when modifying and adding input in the generator plugin.

The application project creation parameters are [Generator Configuration](/docs/guides/topic-detail/generator/config/common).

## New Command

The new command configuration in the application project can be used through the `--config` parameter configuration when executing the new command, or when creating elements and enabling functions in the generator plugin.

### actionType

The action type (actionType) of the New command , the type supports two types:

- element: reate engineering elements

- function: enable function

:::info
This parameter is not required when using the enable function and creating elements in the generator plugin, it is automatically added in the generator plugin.
:::

### element

Element name (element), supports two options:

- Create an application entry(entry)

- Create customized server dir(server)

These two options also need to be used in conjunction with the specific configuration, which is described as follows:

#### name

Entry name (name), character `string` type.

#### framework

Customized server runtime framework(framework)，supports two options:：

- Express(express)

- Koa(koa)

### function

Optional function name (function), supports the following options:

- Tailwind CSS(tailwindcss)

- BFF(bff)

- SSG(ssg)

- Micro Frontend(micro_frontend)

- Unit Test / Integration Test(test)

- Storybook(mwa_storybook)

- UA-based Polyfill Feature'(polyfill)

- Global Proxy(proxy)

`bff` also need to be used in conjunction with configuration, as described below:

#### BFF parameters

##### bffType

BFF type (bffType), supports two options:

- Function mode(function)

- Framework mode(framework)

##### framework

BFF runtime framework (framework)，supports two options：

- Express(express)

- Koa(koa)
