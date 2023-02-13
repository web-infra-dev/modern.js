# Browser Compatibility

This chapter introduces how to use the capabilities provided by Builder to deal with browser compatibility issues.

## Set browserslist

Before dealing with compatibility issues, you first need to clarify which browsers your project needs to support, and add the corresponding browserslist config.

- If you haven't set browserslist yet, please read the [Browserslist](/guide/advanced/browserslist.html) chapter first.

- If you have set a browserslist, Builder will automatically compile according to that scope, downgrade JavaScript syntax and CSS syntax, and inject the required polyfill. In most cases, you can safely use modern ECMAScript features without worrying about compatibility issues.

After setting the browserslist, if you still encountered some compatibility issues, please continue reading below contents to find some solutions.

## Background knowledge

Before dealing with compatibility issues, it is recommended that you understand the following background knowledge to better handle related issues.

### Syntax downgrade and API downgrade

When you use higher-version syntax and API in your project, in order to make the compiled code run stably in lower-version browsers, we need to downgrade two parts: syntax downgrade and API downgrade.

**Builder downgrades syntax through syntax transpilation, and downgrades API through inject polyfill.**

> Grammar and API are not strongly bound. When browser manufacturers implement the engine, they will support some syntax or implement some APIs in advance according to the specification or their own needs. Therefore, browsers from different manufacturers in the same period are not necessarily compatible with syntax and API. So in general practice, syntax and API are handled in two parts.

### Syntax transpilation

**Syntax is a series of rules for how a programming language organizes code**, and code that does not follow these rules cannot be correctly recognized by the programming language's engine and therefore cannot be run. In JavaScript, the following examples are syntax rules:

- In `const foo = 1`, `const` means to declare an immutable constant.
- In `foo?.bar?.baz`, `?.` indicates optional chaining of access properties.
- In `async function () {}`, `async` means to declare an asynchronous function.

Because the parsers of different browsers can support different syntax, especially the old version of the browser engine can support less grammar, so when some syntax are run in the lower version of the browser engine, an error will be reported at the stage of parsing the AST .

For example, the following code will report an error in IE browser or a lower version of Node.js:

```js
const foo = {};
foo?.bar();
```

When we run this code in a low version of Node.js, the following error message will appear:

```bash
SyntaxError: Unexpected token.
   at Object.exports.runInThisContext (vm.js:73:16)
   at Object.<anonymous> ([eval]-wrapper:6:22)
   at Module._compile (module.js:460:26)
   at evalScript (node.js:431:25)
   at startup (node.js:90:7)
   at node.js:814:3
```

It is obvious from the error message that this is a syntax error. This means that this syntax is not supported in lower versions of the engine.

**Syntax can not be supported by polyfill or shim**. If you want to run some syntax that it does not originally support in a low-version browser, you need to transpile the code into a syntax that the low-version engine can support.

Transpile the above code into the following code to run in lower version engines:

```js
var foo = {};
foo === null || foo === void 0 ? void 0 : foo.bar();
```

After transpilation, the syntax of the code has changed, and some syntax that the engine of the lower version cannot understand has been replaced with the syntax it can understand, **but the meaning of the code itself has not changed**.

If the engine encounters an unrecognized syntax when converting to AST, it will report a syntax error and abort the code execution process. In this case, if your project does not use capabilities such as SSR or SSG, the page will be blank, making the page unavailable.

If the code is successfully converted to AST, the engine will convert the AST into executable code and execute it normally inside the engine.

### API Polyfill

JavaScript is an interpreted scripting language, unlike compiled languages like Rust. Rust will check the calls in the code during the compilation phase, and JavaScript does not know whether the function called by this line of code exists before it actually runs to a certain line of code, so some errors will only appear at runtime.

For example:

```js
var str = 'Hello world!';
console.log(str.notExistedMethod());
```

The above code has correct syntax and can be converted to AST correctly in the first stage of the engine runtime, but when it is actually running, because the method `notExistedMethod` does not exist on `String.prototype`, an error will be reported:

```bash
Uncaught TypeError: str.notExistedMethod is not a function
   at <anonymous>:2:17
```

With the iteration of ECMAScript, some new methods will be added to be built-in objects. For example, `String.prototype.replaceAll` was introduced in ES2021, then the `replaceAll` method does not exist in the built-in object `String.prototype` of most browser engines before 2021, so the following code works in the latest Chrome, but not in earlier versions:

```js
'abc'.replaceAll('abc', 'xyz');
```

In order to solve the problem that `String.prototype` lacks `replaceAll` in older browsers, we can extend the `String.prototype` object in older browsers and add the `replaceAll` method to it, for example:

```js
// The implementation of this polyfill does not necessarily conform to the standard, it is only used as an example.
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (
      Object.prototype.toString.call(str).toLowerCase() === '[object regexp]'
    ) {
      return this.replace(str, newStr);
    }
    // If a string
    return this.replace(new RegExp(str, 'g'), newStr);
  };
}
```

> This technique of providing implementations for legacy environments to align new APIs is called polyfill.

## Downgrade method

In Builder, we divide code into three categories:

- The first category is the source code in the current project.
- The second category is third-party dependencies installed through npm.
- The third category is the code out of the current project, such as the code in other directories in the monorepo.

By default, Builder will only compile and downgrade the first category, other categories will not be downgraded by default.

There are several considerations for this approach:

- Downgrading all third-party party dependencies will **significantly reduce build performance**.
- Most third-party dependencies have been downgraded before release, and the second downgrade may introduce new problems.
- The code out of the current project may have been compiled, or the compilation config may be different.

### Downgrade the current project code

The code of the current project will be downgraded by default, so you don't need to add additional config, just make sure that the browserslist config is set correctly.

### Downgrade third-party dependencies

When you find that a third-party dependencies causes compatibility issues, you can add this dependency to Builder's [source.include](/en/api/config-source.html#sourceinclude) config, Make Builder do extra compilation for this dependency.

Taking the npm package `query-string` as an example, you can add the following config:

```ts
import path from 'path';

export default {
  source: {
    include: [/\/query-string\//],
  },
};
```

Please refer to [source.include](/api/config-source.html#sourceinclude) document for detailed usage guide.

### Downgrade the code out of the current project

When you import the code out of the current project, if the code has not been compiled, then you also need to configure [source.include](/en/api/config-source.html#sourceinclude) to it to compile.

For example, if you need to reference a module under the `packages` directory in the monorepo, you can add the following config:

```ts
import path from 'path';

export default {
  source: {
    include: [
      // method one:
      // Compile all files in the package directory of Monorepo
      path.resolve(__dirname, '../../packages'),

      // Method Two:
      // Compile the source code of a package in the Monorepo's package directory
      // The matching range of this writing method is more precise, and has less impact on the overall compilation performance
      path.resolve(__dirname, '../../packages/xxx/src'),
    ],
  },
};
```

## Polyfill mode

Builder compiles JavaScript code through babel or SWC, and injects polyfill libraries like [core-js](https://github.com/zloirock/core-js), [@babel/runtime](https://www.npmjs.com/package/@babel/runtime) and [@swc/helpers](https://www.npmjs.com/package/@swc/helpers).

In different usage scenarios, you may need different polyfill solutions. Builder provides [output.polyfill](/en/api/config-output.html#outputpolyfill) config to switch between different polyfill modes.

### entry mode

entry is the default mode and does not need to be set manually.

When using the entry mode, Builder will analyze which `core-js` methods need to be injected according to the browserslist set by the current project, and inject them to the entry file of each page. The polyfill injected in this way is more comprehensive, and there is no need to worry about the project source code and third-party dependencies polyfill issues. However, because some unused polyfill codes are included, the bundle size may increase.

The config of entry mode is:

```ts
export default {
  output: {
    polyfill: 'entry',
  },
};
```

### usage mode

The usage mode allows more precise control over which core-js polyfills need to be injected.

When you enable the usage mode, Builder will analyze the source code in the project and determine which polyfills need to be injected.

For example, the code uses the `Map` object:

```js
var b = new Map();
```

After compilation, only the polyfills for `Map` will be injected into this file:

```js
import 'core-js/modules/es.map';
var b = new Map();
```

The advantage of this method is that the size of the injected polyfill is smaller, which is suitable for projects with higher requirements on bundle size. The disadvantage is that polyfill may not be fully injected, because third-party dependencies will not be compiled and downgraded by default, so the polyfill required by third-party dependencies will not be analyzed. If you need to analyze a third-party dependency, you also need to add it to [source.include](/en/api/config-source.html#sourceinclude) config.

The config of usage mode is:

```ts
export default {
  output: {
    polyfill: 'usage',
  },
};
```

### Disable Polyfill

You can disable polyfill injection behavior by setting `output.polyfill` to `'off'`.

```ts
export default {
  output: {
    polyfill: 'off',
  },
};
```

When using this config, you need to ensure compatibility by yourself, such as manually import the required polyfill code through [source.preEntry](/en/api/config-source.html#sourcepreentry).
