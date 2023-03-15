- **类型：** `string | string[]`
- **默认值：** `undefined`

在每个页面的入口文件前添加一段代码，这段代码会早于页面的代码执行，因此可以用于执行一些全局的代码逻辑，比如注入 polyfill、设置全局样式等。

#### 添加单个脚本

首先创建一个 `src/polyfill.ts` 文件：

```js
console.log('I am a polyfill');
```

然后将 `src/polyfill.ts` 配置到 `source.preEntry` 上：

```js
export default {
  source: {
    preEntry: './src/polyfill.ts',
  },
};
```

重新运行编译并访问任意页面，可以看到 `src/polyfill.ts` 中的代码已经执行，并在 console 中输出了对应的内容。

#### 添加全局样式

你也可以通过 `source.preEntry` 来配置全局样式，这段 CSS 代码会早于页面代码加载，比如引入一个 `normalize.css` 文件：

```js
export default {
  source: {
    preEntry: './src/normalize.css',
  },
};
```

#### 添加多个脚本

你可以将 `preEntry` 设置为数组来添加多个脚本，它们会按数组顺序执行：

```js
export default {
  source: {
    preEntry: ['./src/polyfill-a.ts', './src/polyfill-b.ts'],
  },
};
```
