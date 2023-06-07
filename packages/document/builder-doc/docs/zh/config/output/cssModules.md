- **类型：**

```ts
type CssModules =
  | boolean
  | {
      auto?: boolean | RegExp | ((resourcePath: string) => boolean);
    };
```

- **默认值：** `true`

是否启用 CSS 模块，或自定义 CSS 模块配置。

#### Boolean 类型

通过将 `output.cssModules` 设置为 true 或 false，来启用或禁用 CSS 模块。

在启用 CSS 模块时，将默认根据 [output.disableCssModuleExtension](/api/config-output.html#outputdisablecssmoduleextension) 配置项来决定将哪些样式文件当做 CSS 模块处理。

也可通过 `output.cssModules.auto` 配置更灵活的文件处理规则。

#### Object 类型

将 `output.cssModules` 设置为对象时，将根据以下配置项决定 CSS 模块行为：

##### auto

auto 配置项允许基于文件名自动启用 CSS 模块。

- **类型：** `boolean | RegExp | ((resourcePath: string) => boolean)`;

- **默认值：** `undefined`

类型说明：

- `undefined`: 根据 [output.disableCssModuleExtension](/api/config-output.html#outputdisablecssmoduleextension) 配置项决定为哪些样式文件启用 CSS 模块。
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
