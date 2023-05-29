用于按需引入组件库的代码和样式，能力等价于 [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import)。

它与 [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import) 的区别在于，`source.transformImport` 不与 Babel 耦合。Builder 会自动识别当前使用的编译工具是 Babel、SWC 还是 Rspack，并添加相应的按需引入配置。

- **类型：**

```ts
type Config =
  | false
  | Array<{
      libraryName: string;
      libraryDirectory?: string;
      style?: string | boolean;
      styleLibraryDirectory?: string;
      camelToDashComponentName?: boolean;
      transformToDefaultImport?: boolean;
      customName?: ((member: string) => string | undefined) | string;
      customStyleName?: ((member: string) => string | undefined) | string;
    }>;
```

- **默认值：**

当项目中安装了 [Ant Design 组件库](https://www.npmjs.com/package/antd) &lt;= 4.x 版本时，Builder 会自动添加以下默认配置：

```js
const defaultAntdConfig = {
  libraryName: 'antd',
  libraryDirectory: isServer ? 'lib' : 'es',
  style: true,
};
```

当项目中安装了 [Arco Design 组件库](https://www.npmjs.com/package/@arco-design/web-react) 时，Builder 会自动添加以下默认配置：

```js
const defaultArcoConfig = [
  {
    libraryName: '@arco-design/web-react',
    libraryDirectory: isServer ? 'lib' : 'es',
    camelToDashComponentName: false,
    style: true,
  },
  {
    libraryName: '@arco-design/web-react/icon',
    libraryDirectory: isServer ? 'react-icon-cjs' : 'react-icon',
    camelToDashComponentName: false,
  },
];
```

:::tip
当你添加了 `antd` 或 `@arco-design/web-react` 相关的配置时，优先级会高于上述默认配置。
:::

### 示例

当使用上述 antd 默认配置：

```js
export default {
  source: {
    transformImport: [
      {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true,
      },
    ],
  },
};
```

源代码如下：

```js
import { Button } from 'antd';
```

会被转换成：

```js
import Button from 'antd/es/button';
import 'antd/es/button/style';
```

### 禁用默认配置

你可以手动设置 `transformImport: false` 来关掉 transformImport 的默认行为。

```js
export default {
  source: {
    transformImport: false,
  },
};
```

比如，当你使用了 `externals` 来避免打包 antd 时，由于 `transformImport` 默认会转换 antd 的引用路径，导致匹配的路径发生了变化，因此 externals 无法正确生效，此时你可以设置关闭 `transformImport` 来避免该问题。

### 配置

#### libraryName

- **类型：** `string`

用于指定需要按需加载的模块名称。当 Builder 遍历代码时，如果遇到了对应模块的 import 语句，则会对其进行转换。

#### libraryDirectory

- **类型：** `string`
- **默认值：** `'lib'`

用于拼接转换后的路径，拼接规则为 `${libraryName}/${libraryDirectory}/${member}`，其中 member 为引入成员。

示例：

```ts
import { Button } from 'foo';
```

转换结果:

```ts
import Button from 'foo/lib/button';
```

#### style

- **类型：** `boolean`
- **默认值：** `undefined`

确定是否需要引入相关样式，若为 `true`，则会引入路径 `${libraryName}/${libraryDirectory}/${member}/style`。
若为 `false` 或 `undefined` 则不会引入样式。

当配置为 `true` 时：

```ts
import { Button } from 'foo';
```

转换结果:

```ts
import Button from 'foo/lib/button';
import 'foo/lib/button/style';
```

#### styleLibraryDirectory

- **类型：** `string`
- **默认值：** `undefined`

该配置用于拼接引入样式时的引入路径，若该配置被指定，则 `style` 配置项会被忽略。拼接引入路径为 `${libraryName}/${styleLibraryDirectory}/${member}`。

当配置为 `styles` 时：

```ts
import { Button } from 'foo';
```

转换结果:

```ts
import Button from 'foo/lib/button';
import 'foo/styles/button';
```

#### camelToDashComponentName

- **类型：** `boolean`
- **默认值：** `true`

是否需要将 camelCase 的引入转换成 kebab-case。

示例：

```ts
import { ButtonGroup } from 'foo';
```

转换结果：

```ts
// 设置成 true：
import ButtonGroup from 'foo/button-group';
// 设置成 false：
import ButtonGroup from 'foo/ButtonGroup';
```

#### transformToDefaultImport

- **类型：** `boolean`
- **默认值：** `true`

是否将导入语句转换成默认导入。

示例：

```ts
import { Button } from 'foo';
```

转换结果：

```ts
// 设置成 true：
import Button from 'foo/button';
// 设置成 false：
import { Button } from 'foo/button';
```

#### customName

- **类型：** `((member: string) => string | undefined) | string`
- **默认值：** `undefined`

:::tip 注意

- 函数类型的配置只能在 Webpack 构建中使用。
- 模版类型的配置只能在 Rspack 构建或者使用了 SWC 的 Webpack 构建中使用。

:::

自定义转换后的导入路径，输入是引入的成员，例如配置成 `` (member) => `my-lib/${member}` ``，会将 `import { foo } from 'bar'` 转换成 `import foo from 'my-lib/foo'`。

在使用 Rspack 构建时，不能使用函数配置，但可以使用 [handlebars](https://handlebarsjs.com/) 模版字符串，对于上面的函数配置，在使用模版字符串时可以用以下模版代替 `my-lib/{{ member }}`，也可以使用一些内置帮助方法，例如 `my-lib/{{ kebabCase member }}` 来转换成 kebab-case 格式，除了 kebabCase 以外还有 camelCase，snakeCase，upperCase，lowerCase 可以使用。

#### customStyleName

- **类型：** `((member: string) => string | undefined) | string`
- **默认值：** `undefined`

:::tip 注意

- 函数类型的配置只能在 Webpack 构建中使用。
- 模版类型的配置只能在 Rspack 构建或者使用了 SWC 的 Webpack 构建中使用。

:::

自定义转换后的样式导入路径，输入是引入的成员，例如配置成 `` (member) => `my-lib/${member}` ``，会将 `import { foo } from 'bar'` 转换成 `import foo from 'my-lib/foo'`。

在使用 Rspack 构建时，不能使用函数配置，但可以使用 [handlebars](https://handlebarsjs.com/) 模版字符串，对于上面的函数配置，在使用模版字符串时可以用以下模版代替 `my-lib/{{ member }}`，也可以使用一些内置帮助方法，例如 `my-lib/{{ kebabCase member }}` 来转换成 kebab-case 格式，除了 kebabCase 以外还有 camelCase，snakeCase，upperCase，lowerCase 可以使用。
