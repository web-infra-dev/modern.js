---
sidebar_position: 1
---

# 什么是微生成器

Modern.js 提供了 `@modern-js/create` 工具和 `new` 命令分别用于初始化创建项目和提供开启一些插件功能的能力，这些工具都是基于微生成器也就是 codesmith 实现的。

codesmith 致力于提供一套微生成器的运行机制，并维护微生成器执行过程中的上下文信息，从而实现各种基于文件、命令等操作，完成复杂的操作。

codesmith 还将常用的方法进行了封装，可以直接使用其提供的 API 函数，可以更方便的实现自身的微生成器。

## 核心概念

### GeneratorCore

GeneratorCore 是 codesmith 运行生成器的核心，维护这生成器执行过程中的上下文及运行方法。

```ts
class GeneratorCore {
  logger: ILogger; // 日志
  materialsManager: MaterialsManager; // 资源
  outputPath: string; // 输出路径
  output: {
    // 输出方法
    fs: (
      file: string | number,
      data: any,
      options?: fs.WriteFileOptions | string,
    ) => Promise<void>;
  };
  _context: GeneratorContext; // 上下文信息
  addMaterial(key: string, material: FsMaterial): void; // 添加资源
  runGenerator(
    generator: string,
    config?: Record<string, unknown>,
  ): Promise<void>; // 运行生成器
  runSubGenerator(
    subGenerator: string,
    relativePwdPath?: string,
    config?: Record<string, any>,
  ): Promise<void>; // 运行子生成器
}
```

### Materials

微生成器资源信息，目前只包含文件资源(fsMaterials)，通过该字段可以获取到生成器执行过程中的 template 资源，并通过 API 对其进行操作。

```ts
class MaterialsManager {
  materialMap: {
    // 资源映射关系
    [materialUri: string]: FsMaterial;
  };
  loadLocalGenerator(generator: string): Promise<FsMaterial>; // 加载本地生成器资源(绝对路径)
  loadRemoteGenerator(generator: string): Promise<FsMaterial>; // 加载远程生成器资源(npm 包)
}
```
