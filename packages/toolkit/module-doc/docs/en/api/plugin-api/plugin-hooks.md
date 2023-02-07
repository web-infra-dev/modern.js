# Plugin Hooks

This chapter describes the lifecycle hooks supported by module-tools.

Currently there are two main types of lifecycle hooks.

* Build hooks: triggered only when the `build` command is executed to build the source code product.
* `buildPlatform` hook: triggered only when the `build --platform` command is executed to generate other build products.
* dev hooks: hooks that are triggered when running the `dev` command.

## build hooks

The following Hooks are triggered in order when the `build` command is executed.

* `beforeBuild`
* `beforeBuildTask`
* `afterBuildTask`
* `afterBuild`

### `beforeBuild`

Triggered before the execution of the overall build process.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeBuild(options: Options): Return {
        return options.config;
      }
    }
  },
});
```

Parameters and return value types.

``` ts
type Options = { options: { config: BuildConfig; cliOptions: BuildCommandOptions } }

export interface BuildCommandOptions {
  config: string;
  clear?: boolean;
  dts?: boolean;
  platform?: boolean | string[];
  tsconfig: string;
  watch?: boolean;
}

type Return = BuildConfig;
```

> `BuildConfig` type reference [API configuration](en/api/)

### `beforeBuildTask`

Based on the build configuration, Module Tools will split the overall build into multiple sub-build tasks. The Hook will be triggered before each build subtask.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeBuildTask(config: BaseBuildConfig): BaseBuildConfig {
        return config;
      }
    }
  },
});
```

Parameters and return value types.

`BaseBuildConfig` type reference [API configuration](en/api/)

### `afterBuildTask`

Triggered after the end of each build subtask.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      afterBuildTask(options: BuildTaskResult): void {
        // ...
      }
    }
  },
});
```

Parameters and return value types.

``` ts
export interface BuildTaskResult {
  status: 'success' | 'fail';
  message?: string;
  config: BaseBuildConfig;
}
```

### `afterBuild`

Triggered after the end of the overall build process.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      afterBuild(options: BuildResult): void {
        // ...
      }
    }
  },
});
```

Parameters and return value types.

``` ts
export interface BuildResult {
  status: 'success' | 'fail';
  message?: string;
  config: BuildConfig;
  commandOptions: BuildCommandOptions;
  totalDuration: number;
}
```

## buildPlatform hooks

module-tools also provides the `build --platform` command to perform specific build tasks.

For example, after installing the Storybook plugin, you can run `build --platform` or `build --platform storybook` to perform Storybook build tasks. This is because the Storybook plugin is based on the buildPlatform Hooks.

Hooks are triggered in the following order after executing `build --platform`.

* `registerBuildPlatform`
* `beforeBuildPlatform`
* `buildPlatform`
* `afterBuildPlatform`

### `registerBuildPlatform`

Gets information about the tasks that need to be run when executing the `build --platform` command.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      registerBuildPlatform(): RegisterBuildPlatformResult {
        // ...
        return {
          platform: 'stroybook',
          build() {
            // run storybook logic
          },
        }, };
      },
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (
    currentPlatform: string, // the currently running platform build task
    context: { isTsProject: boolean },
  ) => void | Promise<void>;
}
```

### `beforeBuildPlatform`

Triggers all registered build tasks when the `build --platform` command is executed. `beforeBuildPlatform` will be triggered before the execution of the overall build task.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeBuildPlatform(platforms: RegisterBuildPlatformResult[]): void {
        console.info(`have ${platforms.length} platform tasks`);
      },
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (
    currentPlatform: string, // the currently running platform build task
    context: { isTsProject: boolean },
  ) => void | Promise<void>;
}
```

### `buildPlatform`

When the `build --platform` command is executed, all registered build tasks will be triggered. `buildPlatform` will be triggered before each build task is executed.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      buildPlatform({ platform }: Options): void {
        console.info(`current task is ${platform}`);
      },
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export interface Options {
  platform: string;
}
```

### `afterBuildPlatform`

When the `build --platform` command is executed, all registered build tasks will be triggered. `afterBuildPlatform` will be triggered after the overall platform build task is finished.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      afterBuildPlatform(result: BuildPlatformResult): void {
        if (result.status === 'success') {
          console.info(`all platform build task success`);
        } else {
          console.error(result.message);
        }
      },
    };
  },
});
```

Types of parameters entered and returned.

```ts
export interface BuildPlatformResult {
  status: 'success' | 'fail';
  message: string | Error | null;
}
```

## Dev Hooks

The following Hooks are triggered in order when the `dev` command is executed.

- `registerDev`: triggered when getting dev function information.
- `beforeDev`: Triggered before starting the dev process as a whole.
- `beforeDevMenu`: triggered before the dev list/menu appears.
- `afterDevMenu`: triggered after dev list/menu option is selected.
- `beforeDevTask`: Triggered before executing the dev task.
- `afterDev`: Triggered at the end of the overall dev process.

### `registerDev`.

Register dev tool related data. Mainly contains.

* the name of the dev tool
* The name of the item displayed in the menu list and the corresponding value.
* The definition of the `dev` subcommand.
* Whether to execute the source code build before running the dev task
* The function to execute the dev task.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      registerDev() {
        return {
          // Dev tool name
          name: 'storybook',
          // Menu content
          menuItem: {
            name: 'Storybook',
            value: 'storybook',
          },
          // Defined dev subcommands
          subCommands: ['storybook', 'story'],
          async action() {
            // dev logic
          },
        };
      },
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export interface DevToolData {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  action: (
    options: { port?: string },
    context: { isTsProject?: boolean },
  ) => void | Promise<void>;
}
```

<!-- :::tip{title='About disableRunBuild configuration'}
When dev a project, it may be possible to set `disableRunBuild: true` to disable build tasks for source execution (in listening mode) if you only need to dev code functionality.

The currently supported Storybook dev supports using source code products as dev objects, so `disableRunBuild: false` in the Storybook plugin.
::: -->

### `beforeDev`

Triggered before the dev task is executed after all dev tool metadata has been collected.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeDev(metas: DevToolData[]) {
        console.info(`have ${metas.length} dev tools`);
      },
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export interface DevToolData {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  action: (
    options: { port?: string },
    context: { isTsProject?: boolean },
  ) => void | Promise<void>;
}
```

### `(before|after)DevMenu`

`beforeDevMenu` is triggered before the dev list/menu appears. Receives [inquirer question](https://github.com/SBoudrias/Inquirer.js#question) as argument. Default value is.

``` ts
const question = [
  {
    name: 'choiceDevTool',
    message: 'Select dev tool',
    type: 'list',
    // Registered dev messages
    choices,
  },
];
```

`afterDevMenu` Triggered after selecting dev list/menu options.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeDevMenu(questions) {
        questions[0].message += '!' ;
        return questions; // required
      },
      afterDevMenu(options: Options) {
        console.info(`choise ${options.result.choiceDevTool} dev tools`);
      }
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export type { QuestionCollection } from 'inquirer';

export interface Options {
  result: PromptResult;
  devTools: DevToolData[];
}

export type PromptResult = { choiceDevTool: string }
export interface DevToolData {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  action: (
    options: { port?: string },
    context: { isTsProject?: boolean },
  ) => void | Promise<void>;
}
```

### `beforeDevTask`

Triggered before the dev task is executed.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeDevTask(currentDevData: DevToolData) {
        console.info(`${currentDevData.name} running`);
      },
    };
  },
});
```

Types of parameters entered and returned.

``` ts
export interface DevToolData {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  action: (
    options: { port?: string },
    context: { isTsProject?: boolean },
  ) => void | Promise<void>;
}
```

### `afterDev`

Triggered when the dev task process is interrupted.

``` ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      afterDev() {
        console.info(`exit!`);
      },
    };
  },
});
```


