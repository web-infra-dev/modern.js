- **类型：** `boolean | PluginSourceBuildOptions`
- **默认值：** `false`
- **版本：** `MAJOR_VERSION.46.0`

用于开启源码构建的能力。当开启此配置项时，Builder 会读取子项目 package.json 的 `source` 字段对应的源码文件，并进行编译。

```ts
export default {
  experiments: {
    sourceBuild: true,
  },
};
```

更多信息可参考[「源码构建模式」](https://modernjs.dev/guides/advanced-features/source-build.html)。

### 选项

`experiments.sourceBuild` 底层基于 Rsbuild 的 [Source Build 插件](https://rsbuild.dev/plugins/list/plugin-source-build#options) 实现，你可以传入插件选项，比如：

```ts
export default {
  experiments: {
    sourceBuild: {
      sourceField: 'my-source',
      resolvePriority: 'output',
    },
  },
};
```
