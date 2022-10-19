---
extractApiHeaders: [2]
---

# Builder Instance

This section describes all the properties and methods on the Builder instance object.

## builder.context

`builder.context` is a read-only object that provides some context infos.

### builder.context.entry

The entry object, corresponding to the `entry` option of `createBuilder` method.

- **Type**

```ts
type BuilderEntry = Record<string, string | string[]>;
```

### builder.context.rootPath

The root path of current build, corresponding to the `cwd` option of `createBuilder` method.

- **Type**

```ts
type RootPath = string;
```

### builder.context.srcPath

The absolute path to the src directory.

- **Type**

```ts
type SrcPath = string;
```

### builder.context.distPath

The absolute path of the output directory, corresponding to the `output.distPath.root` config in `BuilderConfig`.

- **Type**

```ts
type DistPath = string;
```

### builder.context.cachePath

The absolute path of the build cache files.

- **Type**

```ts
type CachePath = string;
```

### builder.context.configPath

The absolute path to the framework config file, corresponding to the `configPath` option of `createBuilder` method.

- **Type**

```ts
type ConfigPath = string | undefined;
```

### builder.context.tsconfigPath

The absolute path of the tsconfig.json file, or `undefined` if the tsconfig.json file does not exist in current project.

- **Type**

```ts
type TsconfigPath = string | undefined;
```

### builder.context.framework

The name of the framework, a unique identifier, the default value is `'modern.js'`.

- **Type**

```ts
type Framework = string | undefined;
```

### builder.context.devServer

Dev Server information, including the current Dev Server hostname and port number.

- **Type**

```ts
type DevServer = {
  hostname: string;
  port: number;
};
```

## builder.build

Perform a production build.

- **Type**

```ts
type BuildOptions = {
  mode?: 'development' | 'production';
  watch?: boolean;
};

function Build(options?: BuildOptions): Promise<void>;
```

- **Example**

```ts
await builder.build();
```

### Development environment build

If you need to perform a development build, you can set the `mode` option to `'development'`.

```ts
await builder.build({
  mode: 'development',
});
```

### Monitor file changes

If you need to watch file changes and re-build, you can set the `watch` option to `true`.

```ts
await builder.build({
  watch: true,
});
```

## builder.startDevServer

Start the local Dev Server, based on the Modern.js Dev Server.

- **Type**

```ts
type StartDevServerOptions = {
  // Whether to output URL infos, the default is true
  printURLs?: boolean;
  // Whether to throw an exception when the port is occupied, the default is false
  strictPort?: boolean;
  // custom Compiler object
  compiler?: Compiler | MultiCompiler;
  // passing through the build-independent dev server configuration
  serverOptions?: Partial<ModernDevServerOptions>;
};

type StartDevServerResult = {
  urls: string[];
  port: number;
  server: Server;
};

function StartDevServer(
  options?: StartDevServerOptions,
): Promise<StartDevServerResult>;
```

- **Example**

Start Dev Server:

```ts
await builder.startDevServer();
```

After successfully starting Dev Server, you can see the following logs:

```bash
info    Starting dev server...
info    Dev server running at:

  > Local:    http://localhost:8080
  > Network:  http://192.168.0.1:8080
```

`startDevServer` returns the following parameters:

- `urls`: URLs to access Dev Server.
- `port`: The actual listening port number.
- `server`: Server instance object.

```ts
const { urls, port, server } = await builder.startDevServer();
console.log(urls); // ['http://localhost:8080', 'http://192.168.0.1:8080']
console.log(port); // 8080

// Close the Dev Server
await server.close();
```

### Disable print URLs

Setting `printURLs` to `false` to disable the default URL output, so you can custom the logs.

```ts
await builder.startDevServer({
  printURLs: false,
});
```

### Strict Port

When a port is occupied, Builder will automatically increment the port number until an available port is found.

Set `strictPort` to `true` and Builder will throw an exception when the port is occupied.

```ts
await builder.startDevServer({
  strictPort: true,
});
```

### Custom Compiler

In some cases, you may want to use a custom compiler:

```ts
const compiler = webpack({
  // ...
});
await builder.startDevServer({
  compiler,
});
```

## builder.createCompiler

Create a Compiler object.

When the `target` option of `createBuilder` contains only one value, the return value is `Compiler`; when `target` contains multiple values, the return value is `MultiCompiler`.

- **Type**

```ts
function CreateCompiler(): Promise<Compiler | MultiCompiler>;
```

- **Example**

```ts
const compiler = await builder.createCompiler();
```

> In most scenarios, you do not need to use this API unless you need to custom the Dev Server or other advanced scenarios.

## builder.addPlugins

Register one or more Builder plugins, which can be called multiple times.

This method needs to be called before compiling. If it is called after compiling, it will not affect the compilation result.

- **Type**

```ts
type AddPluginsOptions = { before?: string } | { after?: string };

function AddPlugins(
  plugins: BuilderPlugins[],
  options?: AddPluginsOptions,
): Promise<void>;
```

- **Example**

```ts
builder.addPlugins([PluginFoo(), PluginBar()]);

// Insert before the bar plugin
builder.addPlugins([PluginFoo()], { before: 'bar' });

// Insert after the bar plugin
builder.addPlugins([PluginFoo()], { after: 'bar' });
```

## builder.removePlugins

Removes one or more Builder plugins, which can be called multiple times.

This method needs to be called before compiling. If it is called after compiling, it will not affect the compilation result.

- **Type**

```ts
function RemovePlugins(pluginNames: string[]): void;
```

- **Example**

```ts
// add plugin
const pluginFoo = PluginFoo();
builder.addPlugins(pluginFoo);

// remove plugin
builder.removePlugins([pluginFoo.name]);
```

## builder.isPluginExists

Determines whether a plugin has been registered.

- **Type**

```ts
function IsPluginExists(pluginName: string): boolean;
```

- **Example**

```ts
builder.addPlugins([PluginFoo()]);

builder.isPluginExists(PluginFoo().name); // true
```

## builder.inspectConfig

Inspect the final generated builder config and bundler config.

- **Type**

```ts
type InspectConfigOptions = {
  // View the config in the specified environment, the default is "development", can be set to "production"
  env?: BuilderMode;
  // Whether to enable verbose mode, display the complete content of the function in the config, the default is `false`
  verbose?: boolean;
  // Specify the output path, defaults to the value configured by `output.distPath.root`
  outputPath?: string;
  // Whether to write the result to disk, the default is `false`
  writeToDisk?: boolean;
};

async function InspectConfig(options?: InspectConfigOptions): Promise<{
  builderConfig: string;
  bundlerConfigs: string[];
}>;
```

- **Example**

Get the config content in string format:

```ts
const { builderConfig, bundlerConfigs } = await builder.inspectConfig();

console.log(builderConfig, bundlerConfigs);
```

Write the config content to disk:

```ts
await builder.inspectConfig({
  writeToDisk: true,
});
```
