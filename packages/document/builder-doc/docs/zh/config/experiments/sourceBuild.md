- **类型：** `boolean`
- **默认值：** `false`
- **打包工具：** `仅支持 webpack`

用于开启源码构建的能力。当开启此配置项时，Builder 会读取子项目 package.json 的 `source` 字段对应的源码文件，并进行编译。

```ts
export default {
  experiments: {
    sourceBuild: true,
  },
};
```

更多信息可参考[「进阶-源码构建模式」](https://modernjs.dev/builder/guide/advanced/source-build.html)。
