---
title: source.preEntry

sidebar_label: preEntry
---


- 类型： `string | string[]`
- 默认值：`undefined`

在每个页面的入口文件前添加一段脚本，这段脚本会早于页面的代码执行，在这个脚本中可以进行执行一些全局的代码配置，比如注入 polyfill 等。

## 示例

### 添加单个脚本

首先创建一个 `src/polyfill.ts` 文件：

```js title="src/polyfill.ts"
console.log('I am a polyfill');
```

然后将 `src/polyfill.ts` 配置到 `source.preEntry` 上：

```js title="modern.config.js"
export default defineConfig({
  source: {
    preEntry: './src/polyfill.ts',
  },
});
```

重新运行编译并访问任意页面，可以看到 `src/polyfill.ts` 中的代码已经执行，并在 console 中输出了对应的内容。

### 添加多个脚本

可以将 `preEntry` 设置为数组来添加多个脚本：

```js title="modern.config.js"
export default defineConfig({
  source: {
    preEntry: ['./src/polyfill-a.ts', './src/polyfill-b.ts'],
  },
});
```
