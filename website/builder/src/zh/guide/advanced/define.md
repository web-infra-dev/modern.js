# 环境变量

Builder 支持在编译过程中向代码中注入环境变量或表达式，这对于区分运行环境、注入常量值等场景很有帮助。本章节会介绍环境变量的使用方式。

## 默认环境变量

默认情况下，Builder 会自动设置 `process.env.NODE_ENV` 环境变量，在开发模式为 `'development'`，生产模式为 `'production'`。

你可以在配置文件和运行时的前端代码中直接使用 `process.env.NODE_ENV`。

```ts
if (process.env.NODE_ENV === 'development') {
  console.log('this is a development log');
}
```

在开发环境，以上代码会被编译为：

```js
if (true) {
  console.log('this is a development log');
}
```

在生产环境，以上代码会被编译为：

```js
if (false) {
  console.log('this is a development log');
}
```

在代码压缩过程中，`if (false) { ... }` 会被识别为无效代码，并被自动移除。

## 使用 define 配置项

通过配置 [source.define](/zh/api/config-source.html#source-define) 选项，你可以在构建时将代码中的变量替换成其它值或者表达式。

define 类似于其它一些语言提供的宏定义能力，但得益于 JavaScript 强大的运行时表达能力，通常不需要像那些语言一样将其用作复杂代码的生成器。它常用于在构建环境向运行时传递环境变量等简单信息，或是辅助 Builder 进行 Tree Shaking 等操作。

### 替换表达式

define 最基础的用途是在构建时替换代码中的表达式。

例如环境变量 `NODE_ENV` 的值会影响许多第三方模块的行为，在构建线上应用的产物时通常需要将它设置为 `"production"`：

```js
export default {
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  },
};
```

需要注意的是这里提供的值必须是 JSON 字符串，例如 `process.env.NODE_ENV` 的值为 `"production"` 则传入的值应当是 `"\"production\""` 才能够正确被处理。

同理 `{ foo: "bar" }` 也应该被转换成 `"{\"foo\":\"bar\"}"`，如果直接传入原始对象则意味着把表达式 `process.env.NODE_ENV.foo` 替换为标识符 `bar`。

`source.define` 的具体行为请参考 [API 文档](/api/config-source.html#source-define)。

:::tip
以上例子中的环境变量 `NODE_ENV` 已经由 Builder 自动注入，通常你不需要手动配置它的值。
:::

## 设置环境变量

针对设置环境变量的高频场景，Builder 还提供了 [source.globalVars](/zh/api/config-source.html#source-globalvars) 配置用于简化配置，它是 `source.define` 的一个语法糖，唯一的区别是 `source.globalVars` 会自动将传入的值进行 JSON 序列化处理，这使得设置环境变量的值更容易，避免大量书写 `JSON.stringify(...)` 转换语句：

```js
export default {
  source: {
    globalVars: {
      'process.env.NODE_ENV': 'production',
      'import.meta.foo': { bar: 42 },
      'import.meta.baz': false,
    },
  },
};
```

需要注意的是不论以上哪种方式都只会匹配完整的表达式，对表达式进行解构会让 Builder 无法正确识别：

```js
console.log(process.env.NODE_ENV);
// => production

const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// => undefined

const vars = process.env;
console.log(vars.NODE_ENV);
// => undefined
```

## Tree Shaking

Define 还可以用于标记死代码以协助 Builder 进行 Tree Shaking 优化。

例如通过将 `process.env.REGION` 替换为具体值来实现针对不同地区的产物进行差异化构建：

```js
export default {
  source: {
    define: {
      'process.env.REGION': JSON.stringify(process.env.REGION),
    },
    // or...
    globalVars: {
      'process.env.REGION': process.env.REGION,
    },
  },
};
```

这样设置后对于存在地区控制的代码：

```js
const App = () => {
  if (process.env.REGION === 'cn') {
    return <EntryFoo />;
  } else if (process.env.REGION === 'sg') {
    return <EntryBar />;
  } else {
    return <EntryBaz />;
  }
};
```

指定环境变量 `REGION=sg` 并执行构建得到的产物会被剔除多余的代码：

```js
const App = () => {
  if (false) {
  } else if (true) {
    return <EntryBar />;
  } else {
  }
};
```

未用到的组件不会被打包到产物中，它们的外部依赖也会对应地被优化，最终即可得到体积和性能都更优的产物代码。

## 源码内联测试

Vitest 支持将测试写在源码文件内，能够在不导出的情况下测试私有功能的行为，并且通过设置 Define 来在正式构建时剔除测试代码。详细指南请参考 [Vitest 官方文档](https://cn.vitest.dev/guide/in-source.html)。

```js
// 函数实现
function add(...args) {
  return args.reduce((a, b) => a + b, 0);
}

// 源码内的测试套件
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it('add', () => {
    expect(add()).toBe(0);
    expect(add(1)).toBe(1);
    expect(add(1, 2, 3)).toBe(6);
  });
}
```
