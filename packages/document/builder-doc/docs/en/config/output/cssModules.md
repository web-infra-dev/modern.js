- **Type:** `boolean | (resourcePath: string) => boolean`
- **Default:** `true`

Allows to enable/disable CSS Modules, or enable CSS Modules for specific files.

When CSS modules are enabled by default, which style files will be processed as CSS Modules modules will be determined according to the [output.disableCssModuleExtension](/api/config-output.html#outputdisablecssmoduleextension) configuration item.

Also, CSS modules can be enabled for specific files by setting `output.cssModules` to `Function`.

### Example

Treat all style files contained in `.module.` or in `shared/` as CSS modules:

```js
export default {
  output: {
    cssModules: (resource) => {
      return resource.includes('.module.') || resource.includes('shared/');
    }
  },
};
```
