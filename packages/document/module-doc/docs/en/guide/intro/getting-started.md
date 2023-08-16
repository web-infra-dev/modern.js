---
sidebar_position: 3
---

# Quick Start

## 3 minute demo

Want to experience Module Tools in action? The only prerequisite you need is [Node.js LTS](https://github.com/nodejs/Release) and make sure your Node version is **>= 14.18.0**.We recommend using the LTS version of Node.js 18.

### Create new project


**If you want to create a complete module project, you can execute the following command:**

```bash
npx @modern-js/create your-project-dir-name
```

:::info
Execute `npx @modern-js/create -h` for more command line arguments
:::

Next, in the issue interaction, follow the options below.

```bash
? Please select the type of project you want to create: Npm Module
? Please fill in the project name: library
? Please select the programming language: TS
? Please select the package manager: pnpm
```

> The project name is the value of the `"name"` field in `package.json`.

Then the process of initializing the project will start. After the project directory and files are generated and the dependencies are installed, a complete module project is created.

We can start the project build directly with the `pnpm build` command, and start the build in watching mode with the `pnpm build --watch` command.

### Add to an existing project

From your shell, install the following dependencies in your project.

- `@modern-js/module-tools`
- `"typescript"` (omitted if not a TypeScript project)

> If it's a TypeScript project, add the `"typescript"` dependency.

```bash
npm install -D @modern-js/module-tools typescript
```

> For projects that use pnpm or the Yarn package manager, just replace npm. **pnpm is recommended**.

Next, create the `modern.config.(t|j)s` file in the root of the project.

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
    plugins: [moduleTools()],
})
```

Finally, add the command `"build": "modern build"` to the project's `package.json` file.

```json
{
  "scripts": {
    "build": "modern build"
  }
}
```

If your project has a `src/index.(js|jsx)` file or both `src/index.(ts|tsx)` and `tsconfig.json` files, then congratulations you can run the `npm run build` command directly to build your project with Module Tools.

### Core npm Package

`@modern-js/module-tools` is the core npm package of Module Tools, providing the following capabilities:

- It offers commonly used CLI commands such as `modern dev`, `modern build`, and more.
- It integrates Modern.js Core, providing capabilities for configuration parsing, plugin loading, and more.
- It integrates esbuild and SWC, providing build capabilities.
- It integrates some commonly used plugins, such as `plugin-lint`, `plugin-changeset`, and others.

`@modern-js/module-tools` is implemented based on the plugin system of Modern.js. Essentially, it is a plugin. Therefore, you need to register `moduleTools` in the `plugins` field of the configuration file:

```ts title="modern.config.ts"
import { moduleTools, defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
});
```

### View official example

**If you want to see the complete project using the modular engineering scheme, you can execute the following command**.

```bash
git clone https://github.com/web-infra-dev/module-tools-examples
cd module-tools-example/base

## Execute the build.
pnpm build

## Execute the build in listening mode.
pnpm build --watch

## Start Storybook
pnpm dev storybook

## Test
pnpm test
```

## Let's get started

Choose your tutorial scenario...

- I'm a beginner and need to learn [basic usage](/en/guide/basic/before-getting-started) of Module Tools.
- I have learned the basic usage of Module Tools and can learn [advanced usage](/en/guide/advance/in-depth-about-build) of Module Tools.
- I need to expand my project capabilities and need to learn how to develop [plugins](/en/plugins/guide/getting-started) for Module Tools.
