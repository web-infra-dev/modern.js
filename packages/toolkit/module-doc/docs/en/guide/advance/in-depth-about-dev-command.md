---
sidebar_position: 2
---

# In-depth understanding of the dev command

The `dev` command provided by the module project is mainly used for debugging the code.

## The overall flow of the command run

1. When the `dev` command is executed, Module Tools starts looking for debugging tools or tasks that can be executed. A debugging tool or task is a Module Tools debugging tool plugin like Storybook.
2. When a debugging tool is found, it is executed immediately.
3. When multiple debugging tools are found, the debugging tools list menu is displayed. A debug tool can be started by selecting the name option corresponding to it.
4. When no debug tool is found, the user is informed that no debug tool is available.

In addition to the `dev` command, you can also start a debugging tool or task directly by using the `dev [debug tool name]` option.

When executing the `dev` command, the debugging tool can choose whether or not to perform a listening mode for code builds before starting, for example the Storybook debugging tool has this feature enabled.


## Storybook


Storybook is currently the official Module Tools debugging tool plugin provided by Module Works.

As we mentioned above, Storybook performs the source build task in listening mode before it is started, so you will see log messages for both Storybook and the source build in the terminal. Changes to the build product are also triggered when the source code is updated, and Storybook hot updates are triggered when the build product changes.

## Extending the dev command

If you need to extend the dev command, or rather provide your own Module Tools debugging tool plug-in, then you will need to know the following first.

* [Development of plugins](plugins/guide/getting-started)
* [Debugging Tools Plugin API](/api/plugin-api/plugin-hooks#调试钩子)

In general, the code to implement a debugging tool that does nothing and the associated configuration is as follows.

``` ts do-nothing.ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'do-nothing',
  setup() {
    return {
      registerDev() {
        return {
          // Debugging tool name
          name: 'do-nothing',
          // Menu display content
          menuItem: {
            name: 'DoNothing',
            value: 'do-nothing',
          },
          // The defined dev subcommand
          subCommands: ['donothing', 'dn'],
          async action() {
            // dev logic
            console.info('Run build --watch, and do nothing.');
          },
        };
      },
    };
  },
});
```

If this debugging tool plugin is required, it needs to be added to the configuration file.

``` ts
import doNothingPlugin from './plugins/do-nothing';

export default defineConfig({
  plugins: [
    //..
    doNothingPlugin()
  ],
});
```

At this point we can execute it when we execute the `dev` or `dev do-nothing` command. After execution, it will first execute the source build task in listening mode and print the log messages immediately afterwards.

For currently officially supported debugging tools and third-party supported debugging tools, you can view them in [plugins list](plugins/official-list/overview).
