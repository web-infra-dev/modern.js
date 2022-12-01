# Plugins
This section describes the configuration related to the plugin

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

Check out[插件](https://modernjs.dev/docs/apis/app/runtime/plugin/plugin-api)for more information
