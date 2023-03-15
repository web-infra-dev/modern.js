- **类型：** `Array<string | Regexp> | Function`
- **默认值：** `undefined`
- **打包工具：** `仅支持 webpack`

限制源代码的引用路径。配置该选项后，所有源文件只能从约定的目录下引用代码，从其他目录引用代码会产生对应的报错提示。

### 示例

首先我们配置 `moduleScopes` 仅包含 `src` 目录：

```js
export default {
  source: {
    moduleScopes: ['./src'],
  },
};
```

然后在 `src/App.tsx` 中导入 `src` 目录外部的 `utils/a` 模块:

```js
import a from '../utils/a';
```

在编译时，会提示引用路径错误:

![scopes-error](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/module-scopes-error.png)

通过该选项配置 `utils` 目录，再进行编译，则不会出现错误提示。

```js
export default {
  source: {
    moduleScopes: ['./src', './utils'],
  },
};
```

#### Array 类型

当 `moduleScopes` 的值为 `Array` 类型时，可以直接设置若干个代码路径，比如添加以下配置：

```js
export default {
  source: {
    moduleScopes: ['./src', './shared', './utils'],
  },
};
```

#### Function 类型

`moduleScopes` 也支持通过函数的形式来进行修改，避免覆盖默认值：

```js
export default {
  source: {
    moduleScopes: scopes => {
      scopes.push('./shared');
    },
  },
};
```
