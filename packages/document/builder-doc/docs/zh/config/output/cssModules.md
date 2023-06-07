- **类型：** `boolean | (resourcePath: string) => boolean`
- **默认值：** `true`

是否启用 CSS 模块，或为特定文件启用 CSS 模块。

在默认启用 CSS 模块时，将根据 [output.disableCssModuleExtension](/api/config-output.html#outputdisablecssmoduleextension) 配置项来决定将哪些样式文件当做 CSS Modules 模块处理。

也可通过将 `output.cssModules` 设置为 `Function` 来为特定文件启用 CSS 模块。

### 示例

将以 `module` 为中缀或 `shared/` 目录下的所有样式文件视为 CSS 模块：

```js
export default {
  output: {
    cssModules: (resource) => {
      return resource.includes('.module.') || resource.includes('shared/');
    }
  },
};
```
