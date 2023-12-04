- **类型：** `Object | Function | undefined`
- **默认值：** `undefined`
- **打包工具：** `仅支持 webpack`

项目中默认不开启 ts-loader，当 `tools.tsLoader` 不为 undefined 则表示开启 ts-loader，同时禁用 babel-loader 对 TypeScript 的编译。

### Object 类型

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。

默认配置如下:

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "ESNext"
  },
  "transpileOnly": true,
  "allowTsInNodeModules": true
}
```

你可以通过 `tools.tsLoader` 配置项来覆盖默认配置:

```ts
export default {
  tools: {
    tsLoader: {
      allowTsInNodeModules: false,
    },
  },
};
```

### Function 类型

当此值为 Function 类型时，默认配置作为第一参数传入，可以直接修改配置对象，也可以返回一个对象作为最终配置；第二个参数为修改 `ts-loader` 配置工具函数集合：

```ts
export default {
  tools: {
    tsLoader: opts => {
      opts.allowTsInNodeModules = false;
    },
  },
};
```

### 工具函数

#### addIncludes

已废弃，请使用 [source.include](https://modernjs.dev/configure/app/source/include.html) 代替，两者功能完全一致。

#### addExcludes

已废弃，请使用 [source.exclude](https://modernjs.dev/configure/app/source/exclude.html) 代替，两者功能完全一致。
