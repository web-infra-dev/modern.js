- **Type:**

```ts
type CheckSyntax =
  | boolean
  | {
      targets: string[];
    };
```

- **Default:** `false`
- **Bundler:** `only support webpack`

Analyzes the build output files for the presence of high-level syntax that is incompatible with the current browserslist. If present, the details will be printed in the terminal.

## Example

```ts
export default {
  security: {
    checkSyntax: true,
  },
};
```

If `security.checkSyntax` is specified as `true`, targets will be recognized as the browserslist set by the project. For details, please refer to [Browserslist](https://modernjs.dev/builder/zh/guide/advanced/browser-compatibility.html)

When enabled, it will be detected in the production environment, and when an incompatible advanced syntax is detected, it will not only print the error logs on the terminal but also exit the build process.

### Error Log

The format of the error log is as follows, including the source file, output location, error reason and source code:

```bash
error [Syntax Checker] Find some syntax errors after production build:

   ERROR#1:
   source - /node_modules/foo/index.js:1:0
   output - /Project/dist/static/js/main.3f7a4d7e.js:2:39400
   reason - The keyword 'const' is reserved (2:39400)
   code - const foo = 'bar';
```

### Solution

If a syntax error is detected, you can handle it in the following ways:

- If you want to downgrade this syntax to ensure good code compatibility, you can compile the corresponding module through the `source.include` config.
- If you don't want to downgrade the syntax, you can adjust the project's browserslist to match the syntax.
