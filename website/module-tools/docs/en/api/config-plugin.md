# Plugins
本章节介绍了插件相关的配置

- type: `CliPlugin<ModuleToolsHooks>[]`
- default: `[]`

```js
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
        beforeDevMenu(originQuestion) {
          return originQuestion;
        },
      };
    },
  };
};
```

查看[插件](https://modernjs.dev/docs/apis/app/runtime/plugin/plugin-api)获取更多信息
