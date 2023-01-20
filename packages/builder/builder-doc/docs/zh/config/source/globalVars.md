- Type: `Record<string, JSONValue>`
- Default:

```ts
// Builder 会自动添加环境变量 `process.env.NODE_ENV` 作为默认值，因此你不需要手动添加它。
const defaultGlobalVars = {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
};
```

构建时将类似 `process.env.FOO` 的全局变量表达式替换为指定的值，比如：

```js
console.log(process.env.NODE_ENV);

// ⬇️ Turn into being...
console.log('development');
```

使用解构赋值时，构建器无法判断变量 `NODE_ENV` 是否与要替换的表达式 `process.env.NODE_ENV` 存在关联，所以这样的使用方式是无效的：

```js
const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// ❌ Won't get a string.
```

`source.globalVars` 是 `source.define` 的一个语法糖，唯一的区别是 `source.globalVars` 会自动将传入的值进行 JSON 序列化处理，这使得设置全局变量的值更容易。注意 `globalVars` 的每个值都需要是可以被 JSON 序列化的值。

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

### 示例

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
