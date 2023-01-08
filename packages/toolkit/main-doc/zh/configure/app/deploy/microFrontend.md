---
sidebar_label: microFrontend
---

# deploy.microFrontend

- 类型：`object`
- 默认值：`{ enableHtmlEntry: true, externalBasicLibrary: false }`

```ts
interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}
```

开发者可使用 `deploy.microFrontend` 属性来配置微前端子应用的信息。

:::caution 注意
需要先通过 `pnpm run new` 启用「微前端」 功能。
:::

## 示例

```ts
export default defineConfig({
  deploy: {
    microFrontend: {
      enableHtmlEntry: true,
    },
  },
});
```

## 配置项

### enableHtmlEntry

- 类型：`boolean`

- 默认值：`true`

是否启用 html 入口的功能，默认为 `true`，将子应用构建成 `HTML` 模式，Garfish 支持了 `html` 入口，可以开启开选项，体验对应功能，为 HTML 入口时直接将子应用 entry 指向子应用的 html 即可。

可以通过设置为 `false`, 表明子应用构建为 `js`，构建为 `js` 后子应用无法独立运行，为 `JS` 入口时将子应用的入口文件指向子应用的 `JS`

### externalBasicLibrary

- 类型：`boolean`

- 默认值：`false`

是否 `external` 基础库，当设置为 `true` 时，当前子应用将会 `external`：`react`、`react-dom`，`EdenX` 主应用会自动 `setExternal` 这两个基础库，如果其他类型的框架请通过 `Garfish.setExternal` 增加 `react`、`react-dom` 依赖
