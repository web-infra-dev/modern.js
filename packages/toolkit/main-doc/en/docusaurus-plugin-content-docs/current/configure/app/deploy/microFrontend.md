---
sidebar_label: microFrontend
---

# deploy.microFrontend

- Type: `object`
- Default: `{ enableHtmlEntry: true, externalBasicLibrary: false }`

```ts
interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}
```

Developers can use the `deploy.microFrontend` to configure micro-frontend sub-application information.

:::caution
Enable the "Micro Frontend" features through `pnpm run new` first.
:::

## Example

```ts
export default defineConfig({
  deploy: {
    microFrontend: {
      enableHtmlEntry: true,
    },
  },
});
```

## Configuration

### enableHtmlEntry

- Type: `boolean`
- Default: `true`

Whether to enable the html entry, the default is `true`, the sub-application is built into the `HTML` mode, Garfish supports the `html` entry, you can turn on the open option, experience the corresponding features, and directly point the sub-application entry to the HTML entry when it is the HTML entry. Just point to the html of the sub-application

Set it to `false` to indicate that the sub-application is built as `js`. After the sub-application is built as `js`, it cannot run independently. When it is a `JS` entry, point the entry file of the sub-application to the `JS` of the sub-application.

### externalBasicLibrary

- Type: `boolean`
- Default: `false`

Whether the `external` base library, when set to `true`, the current child application will be `external`: `react`, `react-dom`, Modern.js main application will automatically `setExternal` these two base libraries, if other types of frameworks Please add `react`, `react-dom` dependencies through `Garfish.setExternal`.
