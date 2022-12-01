---
sidebar_position: 1
---

# What is a microgenerator

Modern.js provides the `@modern-js/create` tool and the `new` command for initialization to create projects and the ability to enable some plugin functions, respectively, these tools are based on microgenerators, also known as codesmith implementations.

Codesmith is committed to providing a set of micro-generator operating mechanism, and maintain the context information in the execution process of the micro-generator, so as to implement various operations based on files, commands, etc., to complete sophisticated operations.

Codesmith also encapsulates the commonly used methods, and can directly use the API functions it provides, which can more easily implement its own micro-generator.

## Core concept

### GeneratorCore

GeneratorCore is the core of codesmith running generator, maintaining the context and running methods during the execution of the generator.

```typescript
class GeneratorCore {
  logger: ILogger;
  materialsManager: MaterialsManager;
  outputPath: string;
  output:
    fs: (file: string | number, data: any, options?: fs.WriteFileOptions | string) => Promise<void>;
  };
  _context: GeneratorContext;
  addMaterial(key: string, material: FsMaterial): void;
  runGenerator(generator: string, config?: Record<string, unknown>): Promise<void>;
  runSubGenerator(subGenerator: string, relativePwdPath?: string, config?: Record<string, any>): Promise<void>;
}
```

### Materials

The micro-generator resource information currently only includes file resources (fsMaterials). Through this field, the template resources in the generator execution process can be obtained and operated through the API.

```typescript
class MaterialsManager {
  materialMap: { // 资源映射关系
    [materialUri: string]: FsMaterial;
  };
  loadLocalGenerator(generator: string): Promise<FsMaterial>;
  loadRemoteGenerator(generator: string): Promise<FsMaterial>;
}
```
