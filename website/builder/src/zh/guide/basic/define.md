# Define 与环境变量

配置 `source.define` 选项可以实现在构建时将代码中的变量替换成其它值或者表达式。

Define 类似于其它一些语言提供的宏定义能力，但得益于 JavaScript 强大的运行时表达能力，通常不会像那些语言一样将其用作复杂代码的生成器。而是常用于在构建环境向运行时传递环境变量等简单信息，或是辅助 Builder 进行 Tree Shaking 等操作。

针对设置环境变量的高频场景，Builder 还提供了 `source.globalVars` 配置用于简化配置。

## 替换表达式

Define 最基础的用途是在构建时替换代码中的表达式。

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

## 设置环境变量

你也可以使用 `source.globalVars` 替换表达式来简化配置、避免大量书写 `JSON.stringify(...)` 转换语句：

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

以上例子中展示的环境变量 `NODE_ENV` 已经由 Builder 自动注入，通常你不需要手动配置它的值。 

需要注意的是不论以上哪种方式都只会匹配完整的表达式，对表达式进行解构会让 Builder 无法正确识别：

```js
console.log(process.env.NODE_ENV)
// => production

const { NODE_ENV } = process.env;
console.log(NODE_ENV)
// => undefined

const vars = process.env;
console.log(vars.NODE_ENV)
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
  },
};
```

这样设置后对于存在地区控制的代码：

```js
const App = () => {
  if (process.env.REGION === 'cn') {
    return <EntryFoo />
  } else if (process.env.REGION === 'sg') {
    return <EntryBar />
  } else {
    return <EntryBaz />
  }
};
```

指定环境变量 `REGION=sg` 并执行构建得到的产物会被剔除多余的代码：

```js
const App = () => {
  if (false) {} else if (true) {
    return <EntryBar />
  } else {}
};
```

未用到的组件不会被打包到产物中，它们的外部依赖也会对应地被优化，最终即可得到体积和性能都更优的产物代码。
