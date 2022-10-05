---
extractApiHeaders: [2]
---

# Builder Instance

本章节描述了 Builder 实例对象上所有的属性和方法。

## builder.context

只读对象，提供一些路径信息。

- **Type**

```ts
type BuilderContext = {
  // 构建入口对象
  entry: BuilderEntry;
  // 当前执行构建的根路径
  rootPath: string;
  // src 路径（绝对路径）
  srcPath: string;
  // 构建产物路径（绝对路径）
  distPath: string;
  // 构建缓存路径（绝对路径）
  cachePath: string;
  // 框架配置文件的路径（绝对路径）
  configPath?: string;
  // tsconfig.json 文件路径（绝对路径）
  tsconfigPath?: string;
  // 框架的英文名称，唯一标识符，默认值为 `'modern.js'`
  framework: string;
  // Dev Server 相关信息
  devServer?: {
    ip: string;
    port: number;
  };
};
```

- **Example**

```ts
console.log(builder.context.distPath);
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
  compiler?: Compiler | MultiCompiler;
};

function StartDevServer(options?: StartDevServerOptions): Promise<void>;
```

- **Example**

```ts
await builder.startDevServer();
```

## builder.createCompiler

创建一个 compiler 对象。

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
  options?: AddPluginsOptions
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
