- **Type:**

```ts
type CheckSyntax =
  | boolean
  | {
      targets?: string[];
      exclude?: RegExp | RegExp[];
      ecmaVersion?: EcmaVersion;
    };
```

- **Default:** `false`

Used to analyze whether there is incompatible advanced syntax in the build artifacts under the current browser scope. If any incompatible syntax is found, detailed information will be printed to the terminal.

### Enable Detection

You can set `checkSyntax` to `true` to enable syntax checking.

```ts
export default {
  security: {
    checkSyntax: true,
  },
};
```

When you enable `checkSyntax`, Builder will perform the detection during production builds. If any incompatible advanced syntax is detected in the build artifacts, error logs will be printed to the terminal, and the current build process will be terminated.

### Error Logs

The format of the error logs is as follows, including the source file, artifact location, error reason, and source code:

```bash
error   [Syntax Checker] Find some syntax errors after production build:

  Error 1
  source:  /node_modules/foo/index.js:1:0
  output:  /dist/static/js/main.3f7a4d7e.js:2:39400
  reason:  Unexpected token (1:178)
  code:
     9 |
    10 | var b = 2;
    11 |
  > 12 | console.log(() => {
    13 |   return a + b;
    14 | });
    15 |
```

:::tip
Currently, syntax checking is implemented based on AST parser. Each time it performs a check, it can only identify the first incompatible syntax found in the file. If there are multiple incompatible syntaxes in the file, you need to fix the detected syntax and re-run the check.
:::

### Solutions

If a syntax error is detected, you can handle it in the following ways:

- If you want to downgrade this syntax to ensure good code compatibility, you can compile the corresponding module through the `source.include` config.
- If you don't want to downgrade the syntax, you can adjust the project's browserslist to match the syntax.
- If you do not want to check the syntax of certain products, you can use the `checkSyntax.exclude` configuration to exclude the files to be checked.

### Options

#### checkSyntax.targets

- **Type:** `string[]`
- **Default:** `The browserslist configuration of the current project`

`targets` is the target browser range of the project. Its value is a standard browserslist array. If you are not familiar with the usage of browserslist, please refer to ["Browserslist"](https://modernjs.dev/builder/en/guide/advanced/browser-compatibility.html).

Builder will read the value of `targets` and automatically deduce the minimum ECMAScript syntax version that can be used in the build artifacts, such as `ES5` or `ES6`.

- **Example:**

For example, if the target browsers to be compatible with in the project are Chrome 53 and later versions, you can add the following configuration:

```ts
export default {
  security: {
    checkSyntax: {
      targets: ['chrome >= 53'],
    },
  },
};
```

Builder will deduce that the ECMAScript syntax version that can be used with `chrome >= 53` is `ES6`. When the build artifacts contain `ES2016` or higher syntax, it triggers syntax error prompts.

:::tip
Please note that Builder does not support automatic analysis of syntax versions above ES6 based on `targets`. If the syntax version compatible with your build artifacts exceeds ES6, please use `checkSyntax.ecmaVersion` to set it.
:::

#### checkSyntax.ecmaVersion

- **Type:** `3 | 5 | 6 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 'latest'`
- **Default:** `Automatically analyzed based on targets`

`ecmaVersion` represents the minimum ECMAScript syntax version that can be used in the build artifact. The priority of `ecmaVersion` is higher than `targets`.

- **Example:**

For example, if the minimum ECMAScript syntax version that can be used in the build artifacts is `ES2020`, you can add the following configuration:

```ts
export default {
  security: {
    checkSyntax: {
      ecmaVersion: 2020,
    },
  },
};
```

At this time, the build artifacts can include all syntax supported by `ES2020`, such as optional chaining.

#### checkSyntax.exclude

- **Type:** `RegExp | RegExp[]`
- **Default:** `undefined`

`exclude` is used to exclude a portion of files during detection. You can pass in one or more regular expressions to match the paths of source files. Files that match the regular expression will be ignored and will not trigger syntax checking.

- **Example:**

For example, to ignore files under the `node_modules/foo` directory:

```ts
export default {
  security: {
    checkSyntax: {
      exclude: /node_modules\/foo/,
    },
  },
};
```
