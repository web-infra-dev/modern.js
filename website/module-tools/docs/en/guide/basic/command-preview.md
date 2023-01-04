---
sidebar_position: 2
---

# Command Preview

Commands available for module engineering projects.

## `modern build`

```bash
Usage: modern build [options]

Build module command

Options:
  -w, --watch Build code in listening mode
  --tsconfig [tsconfig] Specify the path to the tsconfig.json file (default:
                         ". /tsconfig.json")
  --platform [platform] Build products for all or specified platforms
  --no-dts disables DTS type file generation and type checking
  --no-clear disables automatic clearing of product output directories
  -h, --help Show information about the current command
```

When you want to start a project build, you can execute the `modern build` command. When using this command, we can:

- When wanting to start a build in watch mode, use the `--watch` option.
- When you want to specify the path to the TypeScript configuration file read by the project build, use `-build --tsconfig . /path/config.json` option. This option overrides all [`buildConfig`](/zh/api/build-config) configurations in [`dts.tsconfigPath`](/zh/api/build-config).
- The `-no-dts` option can be used when the DTS type file generation and type checking behavior of the project needs to be turned off. **Note: The generation of type files depends on the results of type checking. If type checking is turned off, then type files will not be generated either**.
- The `--no-clear` option can be used when the automatic clearing of the product output directory needs to be turned off.

In addition to the above, module projects also support `platform` build mode, which can be used to perform build tasks for other tools. For example, it is currently officially supported to start a Storybook build task to generate Storybook products by executing the `modern build --platform` or `modern build --platform storybook` commands after installing the `@modern-js/plugin-storybook` plugin.

:::tip{title=Note}
When executing a Storybook build, it needs to read the project's build product. So **when running the `modern build --platform` command to start a Storybook build, run `modern build` once to ensure that the source build product exists**.
:::

## `modern new`

```bash
Usage: modern new [options]

Execute the generator in a modular project scenario

Options:
  -d, --debug Enable Debug mode, print debug log messages (default: false)
  -c, --config <config> Generators run default configuration (JSON string)
  --dist-tag <tag> Generator uses a special version of npm Tag
  --registry customize npm Registry during generator runtime
  -h, --help display help for command
```

The `modern new` command is used to start the microgenerator functionality, which enables features for the project that are not provided by default.

The following features can currently be enabled.

- Storybook debugging
- Tailwind CSS support
- Modern.js Runtime API

You can learn more about these features in the [Using the micro generator](/zh/guide/use-micro-generator) section.

## `modern dev`

```bash
Usage: modern dev [options]

Local development commands

Options:
  -h, --help display help for command

Commands:
[dev-tools-subCommand]
```

The module engineering solution provides the ability to use debugging tools, which can be started with the `modern dev` command. Note, however, that no debugging-related plugins are provided by default, so executing `modern dev` will prompt: _"No dev tools found available "_.

The officially supported debugging tool is [Storybook](https://storybook.js.org/), so you can run `modern dev` or `modern dev storybook` to execute it after you run `modern new` to enable it.

## `modern test`

```bash
Usage: modern test [options]

Options:
  -h, --help display help for command
```

The `modern test` command will automatically run the `src/tests/*.test.(js|ts|jsx|tsx)` file as a test case.

## `modern lint`

```bash
Usage: modern lint [options] [. .files]

lint and fix source files

Options:
  --no-fix disable auto fix source file
  -h, --help display help for command
```

Run [ESLint](https://eslint.org/) to check the syntax of the code. Usually, we only need to check the part of the code that was changed in this commit with [lint-staged](https://github.com/okonet/lint-staged) during the `-git commit` phase.

- The `-no-fix` argument turns off the ability to automatically fix lint error code.

## `-modern change`

```bash
Usage: modern change [options]

Create a changeset

Options:
  --empty Create an empty changeset (default: false)
  --open Open the created changeset in the editor (default: false)
  -h, --help display help for command
```

The `modern change` command is used to generate the required Markdown file for [changesets](https://github.com/changesets/changesets).

## `modern pre`

```bash
Usage: modern pre [options] <enter|exit> [tag]

Entering and exiting pre-publishing mode

Options:
  -h, --help display help for command
```

You can use the `modern pre` command to [pre-release](https://github.com/atlassian/changesets/blob/main/docs/prereleases.md) a version before the official release.

## `modern bump`

```bash
Usage: modern bump [options]

Use changesets to automatically update releases and changelogs

Options:
  --canary Create a pre-release for testing (default: false)
  --preid <tag> Specify an identifier when versioning a pre-release (default: "next")
  --snapshot Create a special version for testing (default: false)
  -h, --help display help for command
```

Modify the version number in `package.json` according to the Markdown file of the changelog generated by [changesets](https://github.com/changesets/changesets), and generate the `CHANGELOG.md` file.

## `modern release`

```bash
Usage: modern release [options]

Release npm packages

Options:
  --tag <tag> Release npm packages with a specific tag (default: "")
  --ignore-scripts release ignores the scripts command in package.json, only supported in pnpm monorepo
                    (default: "")
  -h, --help display help for command
```

The `-modern release` command releases the module to the [npm Registry](https://www.npmjs.com/).

- The `-tag` argument specifies the specific [dist tags](https://docs.npmjs.com/adding-dist-tags-to-packages) to be used for the release.

## `modern gen-release-note`

```bash
Usage: modern gen-release-note [options]

Generate Release Note based on current repository changeset information

Options:
  --repo <repo> The name of the repository to generate the Pull Request link, e.g.: modern-js-dev/modern.js
  --custom <cumtom> Custom Release Note generation function
  -h, --help display help for command
```

Automatically generate [Release Note](https://en.wikipedia.org/wiki/Release_notes) based on the changeset information of the current repository.

:::tip{title=Note}
needs to be executed before the `bump` command.
:::

## `modern upgrade`

```bash
Usage: modern upgrade [options]

Upgrade Modern.js to the latest version

Options:
  --registry <registry> customize npm registry (default: "")
  -d,--debug Enable Debug mode to print debug log messages (default: false)
  --cwd <cwd> project path (default: "")
  -h, --help display help for command
```

The `modern upgrade` command is used to upgrade the project Modern.js related dependencies to the latest version.

Executing the command `npx modern upgrade` in the project root directory will update the Modern.js dependencies in `package.json` of the currently executing project to the latest version by default.

command is provided in `@modern-js/module-tools` version **>= 1.17.0**, previous versions can be upgraded using `npx @modern-js/upgrade`.
