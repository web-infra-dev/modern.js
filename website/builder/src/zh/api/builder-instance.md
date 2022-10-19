---
extractApiHeaders: [2]
---

# Builder Instance

本章节描述了 Builder 实例对象上所有的属性和方法。

## builder.context

`builder.context` 是一个只读对象，提供一些上下文信息。

### builder.context.entry

构建入口对象，对应调用 `createBuilder` 时传入的 `entry` 选项。

- **Type**

```ts
type BuilderEntry = Record<string, string | string[]>;
```

### builder.context.rootPath

当前执行构建的根路径，对应调用 `createBuilder` 时传入的 `cwd` 选项。

- **Type**

```ts
type RootPath = string;
```

### builder.context.srcPath

src 目录的绝对路径。

- **Type**

```ts
type SrcPath = string;
```

### builder.context.distPath

构建产物输出目录的绝对路径，对应 `BuilderConfig` 中的 `output.distPath.root` 配置项。

- **Type**

```ts
type DistPath = string;
```

### builder.context.cachePath

构建过程中生成的缓存文件所在的绝对路径。

- **Type**

```ts
type CachePath = string;
```

### builder.context.configPath

框架配置文件的绝对路径，对应调用 `createBuilder` 时传入的 `configPath` 选项。

- **Type**

```ts
type ConfigPath = string | undefined;
```

### builder.context.tsconfigPath

tsconfig.json 文件的绝对路径，若项目中不存在 tsconfig.json 文件，则为 `undefined`。

- **Type**

```ts
type TsconfigPath = string | undefined;
```

### builder.context.framework

框架的英文名称，唯一标识符，默认值为 `'modern.js'`。

- **Type**

```ts
type Framework = string | undefined;
```

### builder.context.devServer

Dev Server 相关信息，包含了当前 Dev Server 的 hostname 和端口号。

- **Type**

```ts
type DevServer = {
  hostname: string;
  port: number;
};
```

## builder.build

调用 build 方法时，会执行一次生产环境构建。

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

### 开发环境构建

如果需要执行一次开发环境构建，可以将 `mode` 参数设置为 `'development'`。

```ts
await builder.build({
  mode: 'development',
});
```

### 监听文件变化

如果需要自动监听文件变化并重新执行构建，可以将 `watch` 参数设置为 `true`。

```ts
await builder.build({
  watch: true,
});
```

## builder.startDevServer

启动本地 Dev Server，基于 Modern.js Dev Server 实现。

- **Type**

```ts
type StartDevServerOptions = {
  // 是否输出 URL 信息，默认为 true
  printURLs?: boolean;
  // 是否在端口被占用时抛出异常，默认为 false
  strictPort?: boolean;
  // 自定义 Compiler 对象
  compiler?: Compiler | MultiCompiler;
  // 透传与构建无关的 dev server 配置
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

启动 Dev Server：

```ts
await builder.startDevServer();
```

成功启动 Dev Server 后，可以看到以下日志信息：

```bash
info    Starting dev server...
info    Dev server running at:

  > Local:    http://localhost:8080
  > Network:  http://192.168.0.1:8080
```

`startDevServer` 会返回以下参数：

- `urls`：访问 Dev Server 的 URLs
- `port` 实际监听的端口号
- `server`：Server 实例对象

```ts
const { urls, port, server } = await builder.startDevServer();
console.log(urls); // ['http://localhost:8080', 'http://192.168.0.1:8080']
console.log(port); // 8080

// 关闭 Dev Server
await server.close();
```

### 自定义 URL 输出

将 `printURLs` 设置为 `false` 可以禁用默认的 URL 输出，此时你可以输出自定义的日志内容。

```ts
await builder.startDevServer({
  printURLs: false,
});
```

### 严格限制端口

当端口被占用时，Builder 会自动递增端口号，直至找到一个可用端口。

如果你希望在端口被占用时抛出异常，可以将 `strictPort` 设置为 `true`。

```ts
await builder.startDevServer({
  strictPort: true,
});
```

### 自定义 Compiler

个别情况下，你可能希望使用自定义的 compiler：

```ts
const compiler = webpack({
  // ...
});
await builder.startDevServer({
  compiler,
});
```

## builder.createCompiler

创建一个 compiler 对象。

当 `createBuilder` 的 `target` 选项包含一个值时，返回值为 `Compiler`；当 `target` 包含多个值时，返回值为 `MultiCompiler`。

- **Type**

```ts
function CreateCompiler(): Promise<Compiler | MultiCompiler>;
```

- **Example**

```ts
const compiler = await builder.createCompiler();
```

> 大部分场景下，不需要使用该 API，除非需要进行自定义 Dev Server 等高级操作。

## builder.addPlugins

注册一个或多个 builder 插件，可以被多次调用。

该方法需要在开始编译前调用，如果在开始编译之后调用，则不会影响编译结果。

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

// 在 bar 插件之前插入
builder.addPlugins([PluginFoo()], { before: 'bar' });

// 在 bar 插件之后插入
builder.addPlugins([PluginFoo()], { after: 'bar' });
```

## builder.removePlugins

移除一个或多个 builder 插件，可以被多次调用。

该方法需要在开始编译前调用，如果在开始编译之后调用，则不会影响编译结果。

- **Type**

```ts
function RemovePlugins(pluginNames: string[]): void;
```

- **Example**

```ts
// 添加插件
const pluginFoo = PluginFoo();
builder.addPlugins(pluginFoo);

// 移除插件
builder.removePlugins([pluginFoo.name]);
```

## builder.isPluginExists

判断某个插件是否已经被注册。

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

查看 Builder 内部最终生成的 builder 配置和 bundler 配置。

- **Type**

```ts
type InspectConfigOptions = {
  // 查看指定环境下的配置，默认为 "development"，可以设置为 "production"
  env?: BuilderMode;
  // 是否开启冗余模式，展示配置中函数的完整内容，默认为 `false`
  verbose?: boolean;
  // 指定输出路径，默认为 `output.distPath.root` 配置的值
  outputPath?: string;
  // 是否将结果写入到磁盘中，默认为 `false`
  writeToDisk?: boolean;
};

async function InspectConfig(options?: InspectConfigOptions): Promise<{
  builderConfig: string;
  bundlerConfigs: string[];
}>;
```

- **Example**

拿到字符串格式的 Config 内容：

```ts
const { builderConfig, bundlerConfigs } = await builder.inspectConfig();

console.log(builderConfig, bundlerConfigs);
```

直接将配置内容写入到磁盘上：

```ts
await builder.inspectConfig({
  writeToDisk: true,
});
```
