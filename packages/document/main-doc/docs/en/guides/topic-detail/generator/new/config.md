---
sidebar_position: 3
---

# Configuration Parameters

The `new` command provides the [--config](/guides/topic-detail/generator/new/option.html#-c,---config-<config>) parameter, which is used to specify the answers to interactive questions in advance during the execution process.

Here, we will introduce the fields and field values that can be configured in the `config` under different scenario.

## General Configuration

### actionType

Question: Please select the operation you wants.

Options:

- Create project element -- element

- Enable features -- function

- Automatic refactors -- refactor

## Web App

### element

Question: Please select the type of element to create.

Options:

- New "entry" -- entry

- New "Custom Web Server" source code directory -- server

### name

Question: Please fill in the entry name.

:::info
This configuration is required when creating a new application entry, and the configuration value is a string.
:::

### function

Question: Please select the feature name.

Options:

- Enable Rspack Build -- rspack

- Enable Tailwind CSS -- tailwindcss

- Enable BFF -- bff

- Enable SSG -- ssg

- Enable SWC Compile -- swc

- Enable Micro Frontend -- micro_frontend

- Enable UA-based Polyfill Feature -- polyfill

- Enable Global Proxy -- proxy

### bffType

Question: Please select the BFF type

Options:

- Function -- func

- Framework -- framework

:::info
This configuration is required when enabling the BFF function.
:::

### framework

Question: Please select the framework.

Options:

- Express -- express

- Koa -- koa

:::info
This configuration is required when enabling the BFF function.
:::

### refactor

Question: Please select the type of refactoring.

Options:

- Use React Router v5 -- react_router_5

## Npm Module

### function

Question: Please select the feature name.

Options:

- Enable Tailwind CSS -- tailwindcss

- Enable Storybook -- storybook

- Enable Runtime API -- runtime_api
