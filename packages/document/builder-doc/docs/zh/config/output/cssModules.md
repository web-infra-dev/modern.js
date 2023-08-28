- **类型：**

```ts
type CssModuleLocalsConvention =
  | 'asIs'
  | 'camelCase'
  | 'camelCaseOnly'
  | 'dashes'
  | 'dashesOnly';

type CssModules = {
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
  exportLocalsConvention?: CssModuleLocalsConvention;
};
```

- **默认值：** `undefined`

自定义 CSS 模块配置。

### cssModules.auto

auto 配置项允许基于文件名自动启用 CSS 模块。

- **类型：** `boolean | RegExp | ((resourcePath: string) => boolean)`

- **默认值：** `undefined`

类型说明：

- `undefined`: 根据 [output.disableCssModuleExtension](https://modernjs.dev/builder/api/config-output.html#outputdisablecssmoduleextension) 配置项决定为哪些样式文件启用 CSS 模块。
- `true`: 为所有匹配 `/\.module\.\w+$/i.test(filename)` 正则表达式的文件启用 CSS 模块。
- `false`: 禁用 CSS 模块。
- `RegExp`: 为所有匹配 `/RegExp/i.test(filename)` 正则表达式的文件禁用 CSS 模块。
- `function`: 为所有通过基于文件名的过滤函数校验的文件启用 CSS 模块。

```ts
export default {
  output: {
    cssModules: {
      auto: resource => {
        return resource.includes('.module.') || resource.includes('shared/');
      },
    },
  },
};
```

### cssModules.exportLocalsConvention

导出的类名称的样式。

- **类型：** `'asIs' | 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly'`

- **默认值：** `'camelCase'`

类型说明：
- `asIs` 类名将按原样导出。
- `camelCase` 类名将被驼峰化，原始类名仍然可用。
- `camelCaseOnly` 类名将被驼峰化，原始类名不可用。
- `dashes` 只有类名中的破折号会被驼峰化，原始类名仍然可用。
- `dashesOnly` 只有类名中的破折号会被驼峰化，原始类名不可用。

```ts
export default {
  output: {
    cssModules: {
      exportLocalsConvention: 'camelCaseOnly'
    },
  },
};
```
