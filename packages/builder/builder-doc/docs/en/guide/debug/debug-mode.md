# Debug Mode

Builder provides a debug mode to troubleshoot problems, you can add the `DEBUG=builder` environment variable when executing a build to enable Builder's debug mode.

```bash
# Debug development environment
DEBUG=builder pnpm dev

# Debug production environment
DEBUG=builder pnpm build
```

In debug mode, Builder will output some additional log information, and write the Builder config and webpack config to the dist directory, which is convenient for developers to view and debug.

## Log information

In debug mode, you will see some additional information output from the shell, among which are some process logs starting with `debug`, indicating what operations are performed inside the Builder.

```bash
$ DEBUG=builder pnpm dev

debug create context [1842.90 ms]
debug add default plugins [1874.45 ms]
debug add default plugins done [1938.57 ms]
debug init plugins [2388.29 ms]
debug init plugins done [2389.48 ms]
...
```

In addition, the following logs will be output in the Shell, indicating that the Builder has written the internally generated build configs to disk, and you can open these config files to view the corresponding content.

```bash
Inspect config succeeds, open following files to view the content:

   - Builder Config: /Project/demo/dist/builder.config.js
   - Webpack Config (web): /Project/demo/dist/webpack.config.web.js
```

## Builder config file

In debug mode, Builder will automatically generate `dist/builder.config.js` file, which contains the final generated Builder config. In this file, you can know the final result of the Builder config you passed in after being processed by the framework and Builder.

The structure of the file is as follows:

```js
module.exports = {
  dev: {
    // some configs...
  },
  source: {
    // some configs...
  },
  // other configs...
};
```

For a complete introduction to Builder config, please see the [Builder Config](/guide/basic/builder-config.html) chapter.

## webpack config file

In debug mode, Builder will also automatically generate `dist/webpack.config.web.js` file, which contains the final generated webpack config. In this file, you can see what is included in the config that Builder finally passes to webpack.

The structure of the file is as follows:

```js
module.exports = {
  resolve: {
    // some resolve configs...
  },
  module: {
    // some webpack loaders...
  },
  plugins: [
    // some webpack plugins...
  ],
  // other configs...
};
```

In addition, if the project configures additional build targets, such as enabling the SSR capability of the framework (corresponding to additional Node.js build target), an additional `webpack.config.node.js` file will be generated in the `dist` directory, corresponding to the webpack config for SSR bundles.

For a complete introduction to webpack configs, please see [webpack official documentation](https://webpack.js.org/concepts/config/).
