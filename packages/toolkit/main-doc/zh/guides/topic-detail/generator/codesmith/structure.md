---
sidebar_position: 2
---

# 微生成器的组成

一个微生成器项目为一个模块项目或者一个 Npm 包，包中包含几个基本部分：

## package.json

npm 包描述信息，包含 name、version、main 等字段。

## 入口文件

上述 main 字段对应的 js 文件。文件为默认导出一个生成器函数，函数格式如下：

```typescript
export default async (context: GeneratorContext, generator: GeneratorCore) => {

};
```

该函数参数为 context 和 generator：

### context

context 提供 codesmith 运行时维护的上下文信息。其类型定义为：

```typescript
interface GeneratorContext {
  materials: Record<string, FsMaterial>; // 资源
  config: Record<string, any>; // 用户 config 配置
  data?: Record<string, any>; // 用户 data 配置
  current: { material: FsMaterial; } | null; //  当前生成器运行可获取的文件资源
  [key: string]: any; // 其他补充字段
}
```

materials 是 codesmith 的抽象文件系统，维护这生成器名称和可操作文件的映射关系。

materials 中还维护这一个 default 的映射关系，用于维护当前生成器执行目录的资源信息，通过该字段可以对目标项目资源进行操作。

例如当需要修改当前项目的 `package.json` 中的字段:

```typescript
const resource = context.materials.default.get(path.join(appDir, 'package.json'))
```

将获取到的 resource 传递给 codesmith 提供的 JSON API 即可实现 json 操作。

GeneratorContext 的 current 字段上维护这当前运行的生成器文件资源，可以通过 `current.material` 获取到当前的 `FsMaterial`.

FsMaterial 中提供了 get 方法用于获取资源文件并将资源文件传给生成器支持的 API 即可对模板文件进行处理。

例如：

```typescript
const resourceMap = await material.find('templates/**/*');
```

通过上述方式可以获取到生成器中符合 `templates/**/*` 规则的所有模板文件，遍历该对象即可对资源文件进行操作。

### generator

generator 提供 codesmith 运行时的函数方法。其类型定义为：

```typescript
interface GeneratorCore {
    logger: Logger; // log 函数，支持 info、warning、debug、error、verbose、stream
    outputPath: string; // 输出文件路径
    output: {
        fs: (file: string | number, data: any, options?: string | fs.WriteFileOptions | undefined) => Promise<void>
    }; // 写文件方法
    runSubGenerator: (subGenerator: string, relativePwdPath?: string | undefined, config?: Record<string, any> | undefined): Promise<void> // 运行子生成器
}
```

其中 outputPath 和 context 中的 `materials.default` 指向相同的目录，outputPath 用于直接计算目标路径并操作，`materials.default` 用于获取资源文件。

runSubGenerator 提供了在一个微生成器中去运行其他微生成器的方法，该方法将自动更新和维护新的 context 上下文信息。

## Template 文件

生成器模板文件。

推荐在项目根目录创建一个 templates 目录，用于维护该微生成器的模板文件，微生成器执行过程中只能使用自身的模板文件，对于需要共用的模板文件，建议通过共用子生成器实现。
