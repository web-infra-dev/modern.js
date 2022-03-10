---
sidebar_position: 6
---

# 构建
在 Electron 中，一般构建流程如下：**构建渲染进程**、**构建主进程**、**构建应用**。

## 构建主进程

### 构建命令

```ts
{
  "script": {
    "build:main": "modern build electron-main"
  }
}
```

:::warning 警告
- 无论是在哪种项目中，我们都需要在 `package.json` 中配置：main 字段，指定打包后主进程入口文件地址。
- 在此项目中，默认构建后的主进程入口地址在：`electron/main.js`。
:::

### 关于主进程的构建

主进程的构建不会采用 Webpack 打包压缩成单个 bundle, 主要原因是：

- 不维持文件结构会带来很多路径问题。比如：当你使用了 `.node` 文件，则可能需要自己写 Webpack 插件来处理相关的 Node 问题。
- 使用`require(xxx)`动态引入在单文件 bundle 的形式下，将会无法正常工作。

因此，我们维持了主进程的文件结构，并且会对其中的代码进行：Babel 编译、混淆、压缩处理，同时也保留了对环境变量的支持。

这样，维持了 Node 项目的文件结构，构建前后的代码无需做特殊处理、减少了开发者的心智负担、更有利于代码的维护。

## 构建渲染进程

### 构建命令

:::info 补充信息
此处仅以 Modern.js 为例，其余请看下面的“关于渲染进程的构建”讲解。
:::

- 关闭 Node 集成的构建。
```ts
{
  "script": {
    "build:": "modern build"
  }
}
```
- 开启 Node 集成。
```ts
{
  "script": {
    "build:": "modern build electron-render"
  }
}
```

### 关于渲染进程构建


在渲染进程的构建中有两种模式，比如你使用 Webpack 构建：

- 关闭 Node 集成。
- 开启 Node 集成。

无论哪种模式，都需要注意以下几个配置：
- 打包后一般会使用文件协议，因此，建议渲染进程路由切换为：哈希路由。
- 打包后的静态资源非 CDN，因此，在配置静态资源地址的时候，注意相对路径。一般会是：`'../../'`。

对于**开启 Node 集成**，仍然需要做额外的事情，比如你使用 Webpack，则需要做相关的配置：

```ts
  {
    "target": "electron-renderer",
    "node": {
      "__dirname": false,
      "__filename": false
    }
  }
```


## 构建应用

### 构建命令

```ts
{
  "script": {
    "build:app": "modern build electron-app"
  }
}
```
### 构建配置

与构建相关的配置，都存放于 `modern.config.js` 中的 `config.electron.build` 字段中。

在 `builder` 这个配置下有如下一些配置：

```ts
import { Configuration } from 'electron-builder';

export type BuildConfig = {
  baseConfig: Configuration;
  macConfig?: Configuration;
  winConfig?: Configuration;
  win64Config?: Configuration;
  linuxConfig?: Configuration;
};
```

根据上述示例，我们对 electron-builder 的配置本身做了一个简单的整合：

- 对于所有平台（mac、win、linux）通用的 electron-builder 配置，我们放到：`electron.baseConfig` 下。
- 对于不同平台各自特有的配置，我们分别在对应的 key 下配置即可。
- 每一个 key 下面对应的，都是 electron-builder 本身的配置， 详细可见：[Electron Builder 配置](https://www.electron.build/configuration/configuration)。

最后，我们会根据这些配置，再结合框架内部默认的一些用户不需要改的配置（若需要修改，则直接配置就可覆盖），进行合并成最终
 electron-builder 的配置。

### 构建基础配置讲解

在项目创建之初，我们默认了打包需要的一些最基本的配置，放在了 `baseConfig` 里：

```ts
  baseConfig: {
    extraMetadata: {
      name: 'Demo',
    },
    appId: 'com.bytedance.demo',
    artifactName: 'demo_${env.VERSION}.${ext}',
    files: [
      { from: '../assets', to: 'assets' },
      {
        from: '.',
        to: '.',
        filter: [
          '!**/*.map',
          '!**/*.d.ts',
          '!*.log',
          '!*.lock'
          ]
      },
    ],
    directories: {
      app: 'dist',
    },
  }
```

#### `extraMetadata`

这个配置下的字段，最终会生放到应用里的 `package.json` 中。其中：
- `name` 字段会作为应用的名字。

:::info 补充信息
`extraMetadata` 并不是必须的，你可以直接把这些配置写在项目下的 `package.json` 中也可以。
:::

#### `appId`

对于每一个应用来说，都会有一个相对唯一的应用 ID，必须得配置，一般默认结构为：

```ts
appId: "com.example.app"
```

#### `artifactName`

这是应用的安装程序名，一般结构为：`应用名_版本号.文件后缀`。
```ts
${productName} Web Setup ${version}.${ext}
```
可以看到上述示例，其中有三个变量为 electron-builder 的变量：
- ${productName} 产品名
- ${version} 版本号
- ${ext}

以上都会根据用户配置，在构建时自动填充，因此，这里大家直接写变量即可。

> 更多变量请参考: [Electron-builder 配置文档](https://www.electron.build/configuration/configuration#artifact-file-name-template)。

#### `directories.app`

```ts
  directories: {
    app: 'dist',
  },
```
此字段表示当前**构建**的工作目录默认是：项目的根目录。因此，所填写的 `files` 中的路径，均是相对于根目录。

为了构建方便，我们调整为：`dist`。这就表明，所填写的 `files` 中的路径，均是相对于 `dist` 目录。

#### `files`

此字段表示需要复制到应用中的文件内容，相对于 `directories.app` 所配置的路径。若未配置，则相对于项目根目录。

我们会在打包的时候，将必须的：

- 前端构建产物。
- 主进程构建产物。
- 应用处理后的 `package.json`。

均默认放到了：`dist` 目录下。这样，在我们进行应用构建的时候，就可以直接将必须的产物，全部拷贝到应用中。

当然，应用的一些静态资源，比如：`assets`， 我们也需要拷贝，一般放在项目根目录。因此，相对于 `dist` 路径为：`../assets`。

```ts
files: [
  { from: '../assets', to: 'assets' },
  {
    from: '.',
    to: '.',
    filter: [
      '!**/*.map',
      '!**/*.d.ts',
      '!*.log',
      '!*.lock'
      ]
  },
  ],
```

:::warning 警告
  在进行主进程、渲染进程构建产物拷贝的时候，千万不要拷贝：`*.map` 文件，这将会为反编译提供便利，带来极大的安全隐患。
:::






