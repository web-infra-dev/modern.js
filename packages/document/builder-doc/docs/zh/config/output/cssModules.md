- **类型：**

```ts
type CssModules = {
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
};
```

- **默认值：** `undefined`

自定义 CSS 模块配置。

##### cssModules.auto

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
