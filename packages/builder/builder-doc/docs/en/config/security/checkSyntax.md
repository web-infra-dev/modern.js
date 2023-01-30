- **Type**: `boolean | Syntax`

```ts
interface Syntax {
  targets: string[];
}
```

- **Default**: `false`

Analyzes the generated product for the presence of high-level syntax that is not compatible in the specified environment. If present, the details are printed in the terminal.

## Example

```ts
export default {
  security: {
    checkSyntax: true,
  },
};
```

If `security.checkSyntax` is specified as `true`, targets will be recognized as the browserslist set by the project. For details, please refer to [Browserslist](https://modernjs.dev/builder/zh/guide/advanced/browser-compatibility.html)

When enabled, it will be detected in the production environment, and when an incompatible advanced syntax is detected, it will not only print the information on the terminal but also exit the running program.
