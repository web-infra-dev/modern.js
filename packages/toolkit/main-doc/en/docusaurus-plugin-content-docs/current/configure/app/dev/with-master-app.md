---
sidebar_label: withMasterApp
---

# dev.withMasterApp

* Type: `Object`
* Default: `null`

When the project is a micro-front-end sub-application, you can use the `withMasterApp` configuration to enable the sub-application debugging mode.

:::caution Caution
When using child app debugging mode, you should first ensure that the main app has online debugging mode turned on.
:::

```js title=modern.config.js
export default defineConfig({
  dev: {
    withMasterApp: {
      //the path of the main application
      moduleApp: 'https://www.masterApp.com',
      //name of the subapplication
      moduleName: 'Contact'
    }
  }
})
```

- moduleApp: `string` Online address of the main application.
- moduleName: `Contact` The name of the child app (needs to match the module name registered in the main app)。

