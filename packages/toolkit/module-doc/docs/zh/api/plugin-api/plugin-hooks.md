# Plugin Hooks

本章介绍关于 module-tools 支持的生命周期钩子。

目前主要包含两类生命周期钩子：

- 构建钩子：仅在执行 `build` 命令构建源码产物时触发。
- `buildPlatform` 钩子：仅在执行 `build --platform` 命令生成其他构建产物时触发。
- 调试钩子：运行 `dev` 命令时会触发的钩子。

## 构建钩子

在执行 `build` 命令的时候，会按照顺序触发以下 Hooks：

- `beforeBuild`
- `beforeBuildTask`
- `afterBuildTask`
- `afterBuild`

### `beforeBuild`

执行整体构建流程之前触发。

```ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeBuild(options: Options): Return {
        return options.config;
      },
    };
  },
});
```

参数和返回值类型：

```ts
type Options = {
  options: { config: BuildConfig; cliOptions: BuildCommandOptions };
};

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

> `BuildConfig` 类型参考 [API 配置](/api/)

### `beforeBuildTask`

根据构建配置，Module Tools 会将整体构建分成多个子构建任务。该 Hook 将会在每一个构建子任务之前触发。

```ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeBuildTask(config: BaseBuildConfig): BaseBuildConfig {
        return config;
      },
    };
  },
});
```

参数和返回值类型：

`BaseBuildConfig` 类型参考 [API 配置](/api/)。

### `afterBuildTask`

每一个构建子任务结束之后触发。

```ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      afterBuildTask(options: BuildTaskResult): void {
        // ...
      },
    };
  },
});
```

参数和返回值类型：

```ts
export interface BuildTaskResult {
  status: 'success' | 'fail';
  message?: string;
  config: BaseBuildConfig;
}
```

### `afterBuild`

整体构建流程结束之后触发。

```ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      afterBuild(options: BuildResult): void {
        // ...
      },
    };
  },
});
```

参数和返回值类型：

```ts
export interface BuildResult {
  status: 'success' | 'fail';
  message?: string;
  config: BuildConfig;
  commandOptions: BuildCommandOptions;
  totalDuration: number;
}
```

## buildPlatform 钩子

module-tools 还提供了 `build --platform` 命令来执行特定的构建任务。

例如在安装了 Storybook 插件后，就可以执行 `build --platform` 或者 `build --platform storybook` 来执行 Storybook 的构建任务。因为 Storybook 插件基于 buildPlatform Hooks 实现了该功能。

在执行 `build --platform` 后会按照以下顺序触发 Hooks：

- `registerBuildPlatform`
- `beforeBuildPlatform`
- `buildPlatform`
- `afterBuildPlatform`

### `registerBuildPlatform`

获取在执行 `build --platform` 命令时候需要运行的任务信息。

```ts
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
        };
      },
    };
  },
});
```

入参和返回的参数类型：

```ts
export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (
    currentPlatform: string, // 当前运行的 platform 构建任务
    context: { isTsProject: boolean },
  ) => void | Promise<void>;
}
```

### `beforeBuildPlatform`

当执行 `build --platform` 命令的时候，会触发所有已注册的构建任务。`beforeBuildPlatform` 会在执行整体的构建任务之前触发。

```ts
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

入参和返回的参数类型：

```ts
export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (
    currentPlatform: string, // 当前运行的 platform 构建任务
    context: { isTsProject: boolean },
  ) => void | Promise<void>;
}
```

### `buildPlatform`

当执行 `build --platform` 命令的时候，会触发所有已注册的构建任务。`buildPlatform` 会在每个构建任务执行之前触发。

```ts
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

入参和返回的参数类型：

```ts
export interface Options {
  platform: string;
}
```

### `afterBuildPlatform`

当执行 `build --platform` 命令的时候，会触发所有已注册的构建任务。`afterBuildPlatform` 会在整体 platform 构建任务结束后触发。

```ts
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

入参和返回的参数类型：

```ts
export interface BuildPlatformResult {
  status: 'success' | 'fail';
  message: string | Error | null;
}
```

## 调试钩子

在执行 `dev` 命令的时候，会按照顺序触发以下 Hooks：

- `registerDev`: 在获取调试功能信息的时候触发。
- `beforeDev`: 开始执行调试整体流程之前触发。
- `beforeDevMenu`: 出现调试列表/菜单之前触发。
- `afterDevMenu`: 选择调试列表/菜单选项后触发。
- `beforeDevTask`: 执行调试任务之前触发。
- `afterDev`: 执行 dev 整体流程最后触发。

### `registerDev`

注册调试工具相关的数据。主要包含：

- 调试工具的名称
- 显示在菜单列表中的项目名称以及对应的值。
- `dev` 子命令的定义。
- 是否在运行调试任务之前执行源码构建
- 执行调试任务的函数。

```ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      registerDev() {
        return {
          // 调试工具名称
          name: 'storybook',
          // 菜单显示内容
          menuItem: {
            name: 'Storybook',
            value: 'storybook',
          },
          // 定义的 dev 子命令
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

入参和返回的参数类型：

```ts
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

<!-- :::tip{title='关于 disableRunBuild 配置'}
在调试项目的时候，如果仅需要对代码功能进行调试的话，也许可以设置 `disableRunBuild: true` 来关闭对于源码执行（监听模式下的）构建任务。

目前支持的 Storybook 调试支持将源码产物作为调试对象，因此在 Storybook 插件中 `disableRunBuild: false`。
::: -->

### `beforeDev`

在收集完所有调试工具元数据后，执行 dev 任务之前触发。

```ts
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

入参和返回的参数类型：

```ts
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

`beforeDevMenu` 在出现调试列表/菜单之前触发。接收 [inquirer question](https://github.com/SBoudrias/Inquirer.js#question) 作为参数。默认值为：

```ts
const question = [
  {
    name: 'choiceDevTool',
    message: '选择调试工具',
    type: 'list',
    // 注册的调试信息
    choices,
  },
];
```

`afterDevMenu` 选择调试列表/菜单选项后触发。

```ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'my-plugin',

  setup() {
    return {
      beforeDevMenu(questions) {
        questions[0].message += '!';
        return questions; // required
      },
      afterDevMenu(options: Options) {
        console.info(`choise ${options.result.choiceDevTool} dev tools`);
      },
    };
  },
});
```

入参和返回的参数类型：

```ts
export type { QuestionCollection } from 'inquirer';

export interface Options {
  result: PromptResult;
  devTools: DevToolData[];
}

export type PromptResult = { choiceDevTool: string };
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

执行调试任务之前触发。

```ts
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

入参和返回的参数类型：

```ts
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

在中断调试任务进程时触发。

```ts
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
