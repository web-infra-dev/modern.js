Used to import the code and style of the component library on demand, which is equivalent to [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import).

The difference between it and [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import) is that `source.transformImport` is not coupled with Babel. Builder will automatically identify whether the currently used tools is Babel, SWC or Rspack, and apply the corresponding on-demand import configuration.

- **Type:**

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

- **Default:**

When the [Ant Design component library](https://www.npmjs.com/package/antd) &lt;= 4.x version is installed in the project, Builder will automatically add the following default configurations:

```js
const defaultAntdConfig = {
  libraryName: 'antd',
  libraryDirectory: isServer ? 'lib' : 'es',
  style: true,
};
```

When the [Arco Design component library](https://www.npmjs.com/package/@arco-design/web-react) is installed in the project, Builder will automatically add the following default configurations:

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
When you add configurations for `antd` or `@arco-design/web-react`, the priority will be higher than the default configurations mentioned above.
:::

### Example

When using the above antd default configuration:

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

The source code is as follows:

```js
import { Button } from 'antd';
```

It will be transformed into:

```js
import Button from 'antd/es/button';
import 'antd/es/button/style';
```

### Disable Default Config

You can manually set `transformImport: false` to disable the default config.

```js
export default {
  source: {
    transformImport: false,
  },
};
```

For example, if you use `externals` to avoid bundling antd, because `transformImport` will convert the imported path of antd by default, the matching path changes and externals cannot take effect. At this time, you can disable `transformImport` to avoid this problem.

### Configuration

#### libraryName

- **Type:** `string`

The original import path that needs to be transformed.

#### libraryDirectory

- **Type:** `string`
- **Default:** `'lib'`

Used to splice the transformed path, the splicing rule is `${libraryName}/${libraryDirectory}/${member}`, where member is the imported member.

Example:

```ts
import { Button } from 'foo';
```

Out:

```ts
import Button from 'foo/lib/button';
```

#### style

- **Type:** `boolean`
- **Default:** `undefined`

Determines whether to import related styles. If it is `true`, the path `${libraryName}/${libraryDirectory}/${member}/style` will be imported. If it is `false` or `undefined`, the style will not be imported.

When it is set to `true`:

```ts
import { Button } from 'foo';
```

Out:

```ts
import Button from 'foo/lib/button';
import 'foo/lib/button/style';
```

#### styleLibraryDirectory

- **Type:** `string`
- **Default:** `undefined`

This configuration is used to splice the import path when importing styles. If this configuration is specified, the `style` configuration option will be ignored. The spliced import path is `${libraryName}/${styleLibraryDirectory}/${member}`.

When it is set to `styles`:

```ts
import { Button } from 'foo';
```

Out:

```ts
import Button from 'foo/lib/button';
import 'foo/styles/button';
```

#### camelToDashComponentName

- **Type:** `boolean`
- **Default:** `true`

Whether to convert camelCase imports to kebab-case.

Example:

```ts
import { ButtonGroup } from 'foo';
```

Out:

```ts
// set to true:
import ButtonGroup from 'foo/button-group';
// set to false:
import ButtonGroup from 'foo/ButtonGroup';
```

#### transformToDefaultImport

- **Type:** `boolean`
- **Default:** `true`

Whether to convert import statements to default imports.

Example:

```ts
import { Button } from 'foo';
```

Out:

```ts
// set to true:
import Button from 'foo/button';
// set to false:
import { Button } from 'foo/button';
```

#### customName

- **Type:** `((member: string) => string | undefined) | string`
- **Default:** `undefined`

:::tip Note

- Function-type configurations can only be used in Webpack builds.
- Template-type configurations can only be used in Rspack builds or Webpack builds that use SWC.

:::

Customize the imported path after conversion. The input is the imported member. For example, configure it as `` (member) => `my-lib/${member}` ``, which will convert `import { foo } from 'bar'` to `import foo from 'my-lib/foo'`.

When using Rspack to build, function configurations cannot be used, but you can use [handlebars](https://handlebarsjs.com/) template strings. For the above function configuration, you can use the following template instead of `my-lib/{{ member }}`, or use some built-in helper methods, such as `my-lib/{{ kebabCase member }}` to convert it to kebab-case format. In addition to kebabCase, there are also camelCase, snakeCase, upperCase, and lowerCase that can be used.

#### customStyleName

- **Type:** `((member: string) => string | undefined) | string`
- **Default:** `undefined`

:::tip Note

- Function-type configurations can only be used in Webpack builds.
- Template-type configurations can only be used in Rspack builds or Webpack builds that use SWC.

:::

Customize the imported style path after conversion. The input is the imported member. For example, configure it as `` (member) => `my-lib/${member}` ``, which will convert `import { foo } from 'bar'` to `import foo from 'my-lib/foo'`.

When using Rspack to build, function configurations cannot be used, but you can use [handlebars](https://handlebarsjs.com/) template strings. For the above function configuration, you can use the following template instead of `my-lib/{{ member }}`, or use some built-in helper methods, such as `my-lib/{{ kebabCase member }}` to convert it to kebab-case format. In addition to kebabCase, there are also camelCase, snakeCase, upperCase, and lowerCase that can be used.
