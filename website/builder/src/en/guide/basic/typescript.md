# TypeScript

Builder supports TypeScript by default. You can use `. ts` and `. tsx' files out-of-box.

## TypeScript transpilation

Builder has 3 optional ways to handle TypeScript translations.

### Babel

By default, all TypeScript files in the source code will be transpiled by Babel.

You may find some articles pointing out that Babel does not support `const enum` and `namespace alias` syntax, however since version [7.15](https://babeljs.io/blog/2021/07/26/7.15.0) Babel has supported these.

### ts-loader

ts-loader uses the official TypeScript transpiler TSC under the hood, and its transilation performance is similar to Babel. If ts-loader is enabled as transpiler, Babel will not transpile TypeScript files. More configurations can be checked [here](/zh/api/config-tools.html#tools.tsLoader).

By default, if you enable ts-loader transpilation, it won't enable type checking, but just transpile. Type checking is in another process by `fork-ts-checker-webpack-plugin`.

### SWC

If you want to speed up your build phase, and your project doesn't have any other custom Babel plugins, then you can choose SWC to transpile and compress JavaScript and TypeScript. SWC plugin in Builder also has support for TypeScript, TSX and decorator. More details [here](/zh/plugins/plugin-swc.html).

## Type Checking

Builder uses tsChecker(`fork-ts-checker-webpack-plugin`) to check type definition in your source code asynchronously, it does not block project setup. More configurations can be found [here](/zh/api/config-tools.html#tools.tsChecker).

If ts-loader is enabled, and 'compileOnly: false' is set, please disable tsChecker to avoid duplicate type checking.
