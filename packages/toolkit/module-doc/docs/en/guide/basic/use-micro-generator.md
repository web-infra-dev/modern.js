---
sidebar_position: 4
---

# Using the Microgenerator

The Module Engineering solution provides the Microgenerator tool, which allows for the current project to.

- add new directories and files
- Modify the contents of the `package.json` file
- Execute commands

Thus with these capabilities, **Microgenerator can enable additional feature functionality for the project**.

The microgenerator can be started via [`modern new`](/guide/basic/command-preview). The current Microgenerator features supported by the Module Engineering program are:

## Test

When we want to test some modules, we can enable the test feature. When this feature is enabled, **a `tests` directory and related files will be created in the project directory, and a new `"@modern-js/plugin-testing"` dependency will be added to package.json**.


:::tip
After successfully enabling it, you will be prompted to manually add a code similar to the one below to the configuration.
``` ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import testPlugin from '@modern-js/plugin-testing';

export default defineConfig({
  plugins: [
    moduleTools(),
    testPlugin(),
  ],
});
```
:::

## Storybook

The **Storybook feature** can be enabled when we want to debug a component or a common module. When this feature is enabled, **the `stories` directory and related files are created in the project directory, and a new `"@modern-js/plugin-storybook"` dependency is added to package.json**.

:::tip
After successfully enabling it, you will be prompted to manually add a code similar to the one below to the configuration.
``` ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import storybookPlugin from '@modern-js/plugin-storybook';

export default defineConfig({
  plugins: [
    moduleTools(),
    storybookPlugin(),
  ],
});
```
:::

For more information on how to start Storybook and how to use it, check out the following link.

- [`modern dev`](/en/guide/basic/command-preview#modern-dev)
- [`using Storybook`](/en/guide/basic/using-storybook)

## Tailwind CSS support

This can be enabled when we want to add [Tailwind CSS](https://v2.tailwindcss.com/) support to our project. Tailwind CSS is a CSS library that provides out-of-the-box styling.

For more information on how to use Tailwind CSS in your module projects, check out.

<!-- 链接待补充 -->

- Using Tailwind CSS

:::tip
After successfully enabling it, you will be prompted to manually add a code similar to the one below to the configuration.
``` ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import tailwindPlugin from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  plugins: [
    moduleTools(),
    tailwindPlugin(),
  ],
});
```
:::

## Modern.js Runtime API

<!-- 链接待补充 -->

**Modern.js provides Runtime API capabilities that can only be used in the Modern.js application project environment**. If you need to develop a component for use in a Modern.js application environment, then you can turn on this feature and the microgenerator will add the `"@modern-js/runtime"` dependency.

Also, the Storybook debugging tool will determine if the project needs to use the Runtime API by checking the project's dependencies and providing the same Runtime API runtime environment as the Modern.js application project.

:::tip
After successfully enabling it, you will be prompted to manually add a code similar to the one below to the configuration.
``` ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import runtime from '@modern-js/runtime/cli';

export default defineConfig({
  plugins: [
    moduleTools(),
    runtime(),
  ],
});
```
:::
