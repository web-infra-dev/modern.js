- **类型：** `Record<string, JSONValue> | Function`
- **默认值：**

```ts
// Builder 默认会添加环境变量 `process.env.NODE_ENV`，因此你不需要手动添加它。
const defaultGlobalVars = {
  'process.env.NODE_ENV': process.env.NODE_ENV,
};
```

用于在构建时将类似 `process.env.FOO` 的全局变量表达式替换为指定的值，比如：

```js
console.log(process.env.NODE_ENV);

// ⬇️ Turn into being...
console.log('development');
```

### 示例

在下方示例中，会在代码中注入 `ENABLE_VCONSOLE` 和 `APP_CONTEXT` 两个环境变量：

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

你可以在代码中直接使用它们：

```js
if (ENABLE_VCONSOLE) {
  // do something
}

console.log(APP_CONTEXT);
```

### 函数用法

- **类型：**

```ts
type GlobalVarsFn = (
  obj: Record<string, JSONValue>,
  utils: { env: NodeEnv; target: BuilderTarget },
) => Record<string, JSONValue> | void;
```

你可以将 `source.globalVars` 设置为一个函数，从而动态设置一些环境变量的值。

比如，根据当前的构建产物类型进行动态设置：

```js
export default {
  source: {
    globalVars(obj, { target }) {
      obj['MY_TARGET'] = target === 'node' ? 'server' : 'client';
    },
  },
};
```

### 与 define 的区别

`source.globalVars` 是 `source.define` 的一个语法糖，它们之间唯一的区别是，`source.globalVars` 会自动将传入的值进行 JSON 序列化处理，这使得设置全局变量的值更加方便。注意 `globalVars` 的每个值都需要是可以被 JSON 序列化的值。

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

### 注意事项

`source.globalVars` 是通过字符串替换的形式来注入环境变量的，因此它无法对「解构赋值」等动态写法生效。

在使用解构赋值时，Builder 将无法判断变量 `NODE_ENV` 是否与要替换的表达式 `process.env.NODE_ENV` 存在关联，因此以下使用方式是无效的：

```js
const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// ❌ Won't get a string.
```
