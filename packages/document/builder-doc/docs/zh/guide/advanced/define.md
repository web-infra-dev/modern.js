# 环境变量

Builder 支持在编译过程中向代码中注入环境变量或表达式，这对于区分运行环境、注入常量值等场景很有帮助。本章节会介绍环境变量的使用方式。

## 默认环境变量

### process.env.NODE_ENV

默认情况下，Builder 会自动设置 `process.env.NODE_ENV` 环境变量，在开发模式为 `'development'`，生产模式为 `'production'`。

你可以在 Node.js 和运行时代码中直接使用 `process.env.NODE_ENV`。

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

### process.env.ASSET_PREFIX

你可以在运行时代码中使用 `process.env.ASSET_PREFIX` 来访问静态资源的前缀。

- 在开发环境下，它等同于 [dev.assetPrefix](/api/config-dev.html#dev-assetprefix) 设置的值。
- 在生产环境下，它等同于 [output.assetPrefix](/api/config-output.html#output-assetprefix) 设置的值。
- Builder 会自动移除 `assetPrefix` 尾部的斜线符号，以便于进行字符串拼接。

比如，我们通过 [output.copy](/api/config-output.html#output-copy) 配置，将 `static/icon.png` 图片拷贝到 `dist` 目录下：

```ts
export default {
  dev: {
    assetPrefix: '/',
  },
  output: {
    copy: [{ from: './static', to: 'static' }],
    assetPrefix: 'https://example.com',
  },
};
```

此时，我们可以在前端代码中通过以下方式来拼接图片 URL：

```jsx
const Image = <img src={`${process.env.ASSET_PREFIX}/static/icon.png`} />;
```

在开发环境，以上代码会被编译为：

```jsx
const Image = <img src={`/static/icon.png`} />;
```

在生产环境，以上代码会被编译为：

```jsx
const Image = <img src={`https://example.com/static/icon.png`} />;
```

## 使用 define 配置项

通过配置 [source.define](/api/config-source.html#sourcedefine) 选项，你可以在构建时将代码中的变量替换成其它值或者表达式。

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

`source.define` 的具体行为请参考 [API 文档](/api/config-source.html#sourcedefine)。

:::tip
以上例子中的环境变量 `NODE_ENV` 已经由 Builder 自动注入，通常你不需要手动配置它的值。
:::

### process.env 注入方式

在使用 `source.define` 或 `source.globalVars` 时，请避免注入整个 `process.env` 对象，比如下面的用法是不推荐的：

```js
export default {
  source: {
    define: {
      'process.env': JSON.stringify(process.env),
    },
  },
};
```

如果你采用了上述用法，将会导致如下问题：

1. 额外注入了一些未使用的环境变量，导致开发环境的环境变量被泄露到前端代码中。
2. 由于每一处 `process.env` 代码都会被替换为完整的环境变量对象，导致前端代码的包体积增加，性能降低。

因此，请按照实际需求来注入 `process.env` 上的环境变量，避免全量注入。

## 设置环境变量

针对设置环境变量的高频场景，Builder 还提供了 [source.globalVars](/api/config-source.html#sourceglobalvars) 配置用于简化配置，它是 `source.define` 的一个语法糖，唯一的区别是 `source.globalVars` 会自动将传入的值进行 JSON 序列化处理，这使得设置环境变量的值更容易，避免大量书写 `JSON.stringify(...)` 转换语句：

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

## 声明环境变量类型

当你在 TypeScript 代码中读取环境变量时，TypeScript 可能会提示该变量缺少类型定义，此时你需要添加相应的类型声明。

比如你引用了一个 `CUSTOM_VAR` 变量，在 TypeScript 文件中会出现如下提示：

```
TS2304: Cannot find name 'CUSTOM_VAR'.
```

此时，你可以在项目中创建 `src/env.d.ts` 文件，并添加以下内容即可：

```ts title="src/env.d.ts"
declare const CUSTOM_VAR: string;
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
