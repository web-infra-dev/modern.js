- Type: `Object | Function | undefined`
- Default: `undefined`

项目中默认不开启 ts-loader，当 `tools.tsLoader` 不为 undefined 则表示开启 ts-loader，同时禁用 babel-loader 对 TypeScript 的编译。

### 类型

#### Object

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

#### Function

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

`tools.tsLoader` 的值为 Function 类型时，第二个参数可用的工具函数如下：

#### addIncludes

类型: `(includes: string | RegExp | Array<string | RegExp>) => void`

默认情况下只会编译 src 目录下的业务代码，使用 addIncludes 可以指定 ts-loader 编译 `node_modules` 下的一些文件。比如:

```ts
export default {
  tools: {
    tsLoader: (config, { addIncludes }) => {
      addIncludes([/node_modules\/react/]);
    },
  },
};
```

#### addExcludes

类型: `(excludes: string | RegExp | Array<string | RegExp>) => void`

和 `addIncludes` 相反，指定 `ts-loader` 编译时排除某些文件。

例如不编译 src/example 目录下的文件：

```ts
export default {
  tools: {
    tsLoader: (config, { addExcludes }) => {
      addExcludes([/src\/example\//]);
    },
  },
};
```
