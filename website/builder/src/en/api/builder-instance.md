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
  compiler?: Compiler | MultiCompiler;
};

function StartDevServer(options?: StartDevServerOptions): Promise<void>;
```

- **Example**

```ts
await builder.startDevServer();
```

## builder.createCompiler

Create a Compiler object.

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
  options?: AddPluginsOptions
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
