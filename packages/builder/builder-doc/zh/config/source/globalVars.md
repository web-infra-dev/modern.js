- 类型: `Record<string, JSONValue>`
- 默认值: `{}`

构建时将类似 `process.env.FOO` 的全局变量表达式替换为用户定义的值：

```js
console.log(process.env.NODE_ENV);

// ⬇️ Turn into being...
console.log('development');
```

配置的每项都需要是可以序列化成 JSON 的值。

插件会自动添加环境变量 `process.env.NODE_ENV` 到配置。

使用解构赋值时，构建器无法判断变量 `NODE_ENV` 是否与要替换的表达式 `process.env.NODE_ENV` 存在关联，所以这样的使用方式是无效的：

```js
const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// ❌ Won't get a string.
```

`globalVars` 可以当作是 `define` 的语法糖，专门用于简化配置全局变量的流程：

```js
export default {
  source: {
    globalVars: {
      'process.env.BUILD_VERSION': '0.0.1',
      'import.meta.foo': { bar: 42 },
      'import.meta.baz': false,
    },
    define: {
      'process.env.BUILD_VERSION': JSON.stringify('0.0.1'),
      'import.meta': {
        foo: JSON.stringify({ bar: 42 }),
        baz: JSON.stringify(false),
      },
    },
  },
};
```

#### 示例

```js
export default {
  source: {
    globalVars: {
      ENABLE_VCONSOLE: true,
      APP_CONTEXT: { answer: 42 },
    },
  },
};
```
