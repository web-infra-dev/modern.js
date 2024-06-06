---
sidebar_position: 4
---

# Using the Microgenerator

Modern.js Module provides the Microgenerator tool, which allows for the current project to.

- add new directories and files
- Modify the contents of the `package.json` file
- Execute commands

Thus with these capabilities, **Microgenerator can enable additional feature functionality for the project**.

The microgenerator can be started via [`modern new`](/guide/basic/command-preview). The current Microgenerator features supported by the Modern.js Module are:

## Develop Module Doc

When we want to write documentation for out module project, we can enable the module doc feature. **will create `docs` directory and related files in the project directory, and add `"@modern-js/plugin-rspress"` dependency** in package.json.
Use `modern dev` and `modern build --platform` to debug and build your doc site.

:::tip
After successfully enabling it, you will be prompted to manually add a code similar to the one below to the configuration.

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginDoc } from '@modern-js/plugin-rspress';

export default defineConfig({
  plugins: [moduleTools(), modulePluginDoc()],
});
```

## Storybook

The **Storybook feature** can be enabled when we want to debug a component or a common module. When this feature is enabled, **the `stories` directory and `.storybook` directory are created in the project directory, and a new `"@modern-js/storybook"` dependency is added to package.json**. Use `storybook dev` and `storybook build` to debug and build.

## Tailwind CSS Support

[Tailwind CSS](https://tailwindcss.com/) is a CSS framework and design system based on Utility Class, which can quickly add common styles to components, and support flexible extension of theme styles.

If you want to use Tailwind CSS for a project, you can refer to ["Using Tailwind CSS"](https://modernjs.dev/module-tools/guide/best-practices/components.html#tailwind-css).

## Modern.js Runtime API

**Modern.js provides Runtime API capabilities that can only be used in the Modern.js application project environment**. If you need to develop a component for use in a Modern.js application environment, then you can turn on this feature and the microgenerator will add the `"@modern-js/runtime"` dependency.

Also, the Storybook debugging tool will determine if the project needs to use the Runtime API by checking the project's dependencies and providing the same Runtime API runtime environment as the Modern.js application project.

:::tip
After successfully enabling it, you will be prompted to manually add a code similar to the one below to the configuration.

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import runtime from '@modern-js/runtime/cli';

export default defineConfig({
  plugins: [moduleTools(), runtime()],
});
```

:::
