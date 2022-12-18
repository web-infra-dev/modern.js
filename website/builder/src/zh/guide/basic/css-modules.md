# 使用 CSS Modules

[CSS Modules](https://github.com/css-modules/css-modules) 让我们能以模块化的方式编写 CSS 代码，并且可以在 JavaScript 文件中导入和使用这些样式。使用 CSS Modules 可以自动生成唯一的类名，隔离不同模块之间的样式，避免类名冲突。

Builder 默认支持使用 CSS Modules，无需添加额外的配置。我们约定使用 `[name].module.css` 文件名来启用 CSS Modules。

以下样式文件会被视为 CSS Modules：

- `*.module.scss`
- `*.module.less`
- `*.module.css`

## 示例

- 编写样式：

```css
/* button.module.css */
.error {
  background: red;
}
```

- 使用样式：

```tsx
// Button.tsx
import React, { Component } from 'react';
// 引入样式文件
import styles from './button.module.css';

export default () => {
  return <button className={styles.error}>Error Button</button>;
};
```

## 为所有样式文件启用 CSS Modules

在默认情况下，只有 `*.module.css` 结尾的文件才被视为 CSS Modules 模块。

如果你想将源码目录下的所有 CSS 文件当做 CSS Modules 模块进行处理，可以通过开启 [output.disableCssModuleExtension](/zh/api/config-output.html#output-disablecssmoduleextension) 来实现，比如：

```ts
export default {
  output: {
    disableCssModuleExtension: true,
  },
};
```

设置后，以下两个文件都会被视为 CSS Modules：

```ts
import styles1 from './foo.module.css';
import styles2 from './bar.css';
```

:::tip
我们不推荐开启此配置项，因为开启 `disableCssModuleExtension` 后，CSS Modules 文件和普通 CSS 文件无法得到明确的区分，不利于长期维护。
:::

## 自定义类名

自定义 CSS Modules 生成的类名也是我们比较常用的功能，你可以使用 [output.cssModuleLocalIdentName](/zh/api/config-output.html#output-cssmodulelocalidentname) 来进行配置。

```ts
export default {
  output: {
    cssModuleLocalIdentName: '[hash:base64:4]',
  },
};
```

如果你需要自定义 CSS Modules 的其他配置，可以通过 [tools.cssLoader](/zh/api/config-tools.html#css-loader) 进行设置。

## 添加类型声明

当你在 TypeScript 代码中引用 CSS Modules 时，TypeScript 可能会提示该模块缺少类型定义：

```
TS2307: Cannot find module './index.module.css' or its corresponding type declarations.
```

此时你需要为 CSS Modules 添加类型声明文件，请在项目中创建 `src/global.d.ts` 文件，并添加相应的类型声明：

```ts
// src/global.d.ts
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

如果你开启了 `disableCssModuleExtension` 配置值，还需要添加以下类型：

```ts
// src/global.d.ts
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

添加类型声明后，如果依然存在上述错误提示，请尝试重启当前 IDE，或者调整 `global.d.ts` 所在的目录，使 TypeScript 能够正确识别类型定义。
