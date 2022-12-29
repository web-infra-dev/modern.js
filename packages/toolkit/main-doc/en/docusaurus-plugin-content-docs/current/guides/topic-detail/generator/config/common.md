---
sidebar_position: 1
---

# Generator Configuration

### solution

Engineering solution type (solution), the options are as follows:

- Application(mwa)

- Module(module)

- Monorepo

:::info
Solution configuration can only be used in the `--config` parameter of `@modern-js/create`, not by setting the default value in the generator plugin.
:::

### scenes

Project scenarios (scenes), when using the generator plugin that creates the project scene type, this value is the key value of the corresponding generator plugin.

:::info
scenes configuration can only be used in the `--config` parameter of `@modern-js/create`, not by setting the default value in the generator plugin.
:::

### language

Development language (language), the options are as follows:

- TS(ts)

- ES6+(js)

### packageManager

Package management tool (packageManager), the options are as follows:

- pnpm(pnpm)

- Yarn(yarn)


:::info
In the custom type of the generator plugin to create a project scenario, only the `packageManager` configuration is provided by default.
:::

## Other configurations

### noNeedInstall

* Type: Boolean

* Default: false

Whether to skip the dependency installation.

### noNeedGit

* Type: Boolean

* Default: false

Whether to skip git initialization and commit initial commit.

### successInfo

* Type: String

* Default: Command operation prompts for different project schemes.

Customize prompt information to create project success.

### isMonorepoSubProject

* Type: Boolean

* Default: false

Whether it is a Monorepo subproject.

### isTest

* Type: Boolean

   - true: create project to `examples/`

   - false: create project to `apps/`

* Default: false

Works on an Application (MWA) project to identify whether it is a test project.

### isPublic

* Type: Boolean

   - true: create project to `packages/`

   - false: create project to `features/`

* Default: false

Used in the Module project to identify whether it needs to be published to npm.
