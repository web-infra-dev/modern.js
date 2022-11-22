- Type: `string[]`
- Default: `undefined`

指定项目兼容的目标浏览器范围。该值会被 [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) 和 [autoprefixer](https://github.com/postcss/autoprefixer) 用来确定需要转换的 JavaScript 语法特性和需要添加的 CSS 浏览器前缀。

#### 优先级

`overrideBrowserslist` 配置的优先级高于项目中的 `.browserslistrc` 配置文件和 package.json 中的 `browserslist` 字段。

大多数场景下，推荐优先使用 `.browserslistrc` 文件，而不是使用 `overrideBrowserslist` 配置。因为 `.browserslistrc` 文件是官方定义的配置文件，更加通用，可以被社区中的其他库识别。

#### 默认值

如果项目中没有定义任何 `browserslist` 相关的配置，也没有定义 `overrideBrowserslist`，那么 Builder 会设置默认值为：

```js
['> 0.01%', 'not dead', 'not op_mini all'];
```

#### 示例

下面是兼容移动端 H5 场景的示例：

```js
export default {
  output: {
    overrideBrowserslist: [
      'iOS 9',
      'Android 4.4',
      'last 2 versions',
      '> 0.2%',
      'not dead',
    ],
  },
};
```

可以查看 [browserslist 文档](https://github.com/browserslist/browserslist) 来了解如何自定义浏览器范围。
