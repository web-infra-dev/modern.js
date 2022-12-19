# Plugins
本章介绍插件相关的 API，包括插件的基本用法，插件的钩子，插件的配置等。

Modern.js的插件系统借鉴了[follow-pipeline](https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline)，你可以通过hooks介入到各个流程中。

## Basic Usage

- type: `CliPlugin<ModuleToolsHooks>[]`
- default: `[]`

```ts modern.config.ts
import { defineConfig } from '@modern-js/module-tools';
import myPlugin from '.';

export default defineConfig({
  plugins: [myPlugin()]
});
```

一个插件的基本结构如下：
```ts myPlugin.ts
export default (): CliPlugin<ModuleToolsHooks> => {
  return {
    name: 'dev-plugin-example',
    setup: () => {
      return {
        registerDev() {
          return {
            name: 'plugin-example',
            menuItem: {
              name: 'dev-example',
              value: 'dev-example',
            },
            action() {
              console.info('running dev-example');
            },
          };
        },
      };
    },
  };
};
```


## Hooks

### Types
Module tools主要使用到了两种类型的钩子，分别是 `ParallelWorkflow` 和 `AsyncPipeline` 。
- `ParallelWorkflow` 是一个并行的钩子，可以同时执行多个钩子，但是不会等待钩子执行完毕，而是立即返回。
- `AsyncPipeline` 是一个串行的钩子，会等待上一个钩子执行完毕后再执行下一个钩子。
创建钩子时，需要指定钩子的输入和输出类型，例如 `createParallelWorkflow<void, void>` ，表明这个钩子没有输入，也没有输出。

### Dev Hooks

#### registerDev
- type: `ParallelWorkflow<void, DevToolData>`
- 注册dev任务,storybook 就是通过这个hooks注册的

#### beforeDev
- type: `ParallelWorkflow<DevToolData[], void>`
- 在dev任务执行之前执行

#### afterDev
- type: `ParallelWorkflow<void, void>`
- 在dev任务执行之后执行

#### beforeDevMenu
- type: `ParallelWorkflow<QuestionCollection, QuestionCollection | void>`
- 在选择dev任务菜单执行之前执行

#### afterDevMenu
- type: `ParallelWorkflow<{ result: PromptResult; devTools: DevToolData[] }, void>`
- 在选择dev任务菜单执行之后执行

#### beforeDevTask
- type: `ParallelWorkflow<DevToolData, void>`
- 在执行每一项dev任务前执行

### BuildHooks

#### beforeBuild
- type: `ParallelWorkflow<{ config: BuildConfig; options: BuildCommandOptions }, BuildConfig>`
- 在所有的构建任务执行之前执行

#### afterBuild
- type: `ParallelWorkflow<BuildResult, void>`
- 在所有的构建任务执行完后执行

#### beforeBuildTask
- type: `ParallelWorkflow<{ config: BaseBuildConfig; options: BuildCommandOptions }, BaseBuildConfig>`
- 在每一项构建任务执行之前执行,

#### afterBuildTask
- type: `ParallelWorkflow<BuildTaskResult, void>`
- 在每一项构建任务执行完后执行

#### registerBuildPlatform
- type: `ParallelWorkflow<void, RegisterBuildPlatformResult>`
- 注册构建平台, storybook 的构建就是通过这个hooks注册的

#### beforeBuildPlatform
- type: `ParallelWorkflow<RegisterBuildPlatformResult[], void>`
- 在构建平台之前执行

#### afterBuildPlatform
- type: `ParallelWorkflow<void, BuildPlatformResult>`
- 在构建平台完后执行
