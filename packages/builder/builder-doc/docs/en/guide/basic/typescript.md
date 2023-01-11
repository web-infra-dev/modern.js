# Use TypeScript

Builder supports TypeScript compilation and type checking by default, you can use `. ts` and `. tsx' files in the project without any configuration.

## TypeScript compilation

Builder has three ways to compile TypeScript files.

**Babel**

By default, all TypeScript files are compiled by Babel.

You may find some old articles pointing out that Babel cannot handle `const enum` and `namespace alias` syntax, however since version [7.15](https://babeljs.io/blog/2021/07/26/7.15.0) Babel has supported them. Babel compile is enabled by default.

If you want more Babel plugins

**ts-loader**

The ts-loader uses TypeScript's official compiler-TSC under the hood. When ts-loader is enabled, TypeScript files will no longer be compiled by Babel, but Babel will still inject polyfill into the TSC output and transform it to the lower version of JavaScript.

Enable ts-loader(with default options):

```ts
export default {
  tools: {
    tsLoader: {},
  },
};
```

More configuration can be found at [tools.tsLoader](/en/api/config-tools.html#tools-tsloader).

If ts-loader is enabled with default configuration, it does not have type checking, we do type checking by [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).

**SWC**

If you want a super fast compiler, and you don't need some custom Babel plugins, then you can use SWC for compilation and minification.

SWC plugin in Builder supports TypeScript, TSX and legacy decorator, you can check [SWC plugin](/en/plugins/plugin-swc.html).

### Why Babel is the default option

Babel supports TypeScript well. It cannot check types, but we can check types in another process. Babel follows standards more when compiled to lower versions of JavaScript in certain situations. For example, Babel will initialize class members as undefined, and mark class methods as non-enumerable. If TSC is enabled, for better syntax downgrading and Polyfill, the TSC output will still be compiled by Babel, causing unnecessary performance costs.

## Type checking

Currently, the only stable TypeScript type checking tool is TSC, and it usually takes a while to check types in a large project, so Builder by default using tsChecker([fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)) for asynchronous type checking, it won't block project setup.

Set tsChecker(with default options):

```ts
export default {
  tools: {
    tsChecker: {},
  },
};
```

More configurations can be seen at [tsChecker configuration](/en/api/config-tools.html#tools-tschecker)。

Note that if ts-loader is enabled and `compileOnly: false` is set, please disable tsChecker to avoid duplicate type-checking.

:::tip STC
The author of SWC has announced a new open-source type-checking tool based on Rust, which is called [STC](https://github.com/dudykr/stc), it's super fast but it cannot used for production now, really don't recommend you use that for now, when it's stabled we will use that in Builder SWC plugin as experimental ability.
:::
