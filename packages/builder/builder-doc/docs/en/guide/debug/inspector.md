# Using Webpack Inspector

Builder has a built-in [webpack inspector](https://github.com/modern-js-dev/webpack-inspector) to debug webpack.

## Introduce

The internal workflow of webpack is relatively black box, when using webpack, we often encounter the following problems:

- When using some upper-level frameworks, I don't know what the final generated webpack config contains.
- Each module will be processed by different loaders, and the compilation results of each loader are difficult to perceive.
- It is difficult to analyze the time cost of each webpack loader (such as babel-loader, ts-loader).

In order to make performance analysis, error investigation and loader development more convenient, we provide the [webpack inspector](https://github.com/modern-js-dev/webpack-inspector) tool in the Builder.

## Enable

You can enable webpack inspector through [tools.inspector](/en/api/config-tools.html#toolsinspector) config:

```ts
export default {
  tools: {
    inspector: {},
  },
};
```

In order to prevent the inspector from affecting normal development, it is recommended to enable the inspector only in DEBUG mode:

```ts
export default {
  tools: {
    inspector: process.env.DEBUG ? {} : undefined,
  },
};
```

After adding the above config, when you execute `DEBUG=true pnpm dev`, Builder will start the inspector after the compilation is complete. At this time, you can see the following information in the Shell:

```shell
info    Starting dev server...

【Webpack Inspector】🔥 started at http://localhost:3333
```

Open the `http://localhost:3333` address to access the debug panel of the inspector.

## Debug Panel

The Inspector's debugging panel provides multiple modes, which you can switch through the buttons in the upper right corner.

### Config Preview Mode

The default mode of the panel is config preview mode. In this mode, you can view all config information inside webpack, and the config object can be expanded or collapsed:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/39248c0f-b1cd-4ea5-b522-3ebba7569497.png)

### List Mode

In this mode, all module information will be displayed:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/8ff3bba0-7824-43b3-996f-7a3b5d2c4f59.png)

Clicking on the list item will display the compilation details of the module:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/output.png)

### Loader Statistics

Click the following switch to view loader statistics:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/c0697cd6-963f-4169-8dc3-dc178641a861.png)

### Dependency Graph Mode

In this mode, the dependencies of all modules will be displayed:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/9ee30176-e993-4638-83d0-add14484b1b2.png)

Clicking on a node in the graph will also display the compilation details of the specific module:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/6f4b6cc7-94c8-446a-8b64-86ca98fbdca7.png)

:::tip
For performance reasons, the dependency graph is not displayed when the number of modules is > 100.
:::
