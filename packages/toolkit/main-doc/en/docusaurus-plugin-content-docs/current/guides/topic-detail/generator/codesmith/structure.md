---
sidebar_position: 2
---

# The composition of the microgenerator

A microgenerator project is a module project or an Npm package that contains several basic parts:

## package.json

NPM package description information, including name, version, main and other fields.

## Entry file

The js file corresponding to the above main field. The file exports a generator function by default, and the function format is as follows:

```typescript
export default async (context: GeneratorContext, generator: GeneratorCore) => {

};
```

The function parameters are context and generator:

### context

Context provides context information maintained by the codesmith runtime. Its type is defined as:

```typescript
interface GeneratorContext {
  materials: Record<string, FsMaterial>;
  config: Record<string, any>;
  data?: Record<string, any>;
  current: { material: FsMaterial; } | null;
  [key: string]: any;
}
```

Materials is an abstract file system for codesmith that maintains the mapping between generator names and actionable files.

Materials also maintains this default mapping relationship, which is used to maintain the resource information of the current generator execution directory, and can operate on the target project resources through this field.

For example, when you need to modify a field in the `package.json` of the current project:

```typescript
const resource = context.materials.default.get(path.join(appDir, 'package.json'))
```

Pass the acquired resources to the JSON API provided by codesmith to implement json operations.

The currently running generator file resource is maintained on the current field of `GeneratorContext`, and the current `FsMaterial` can be obtained through `current.material`.

The get method is provided in `FsMaterial` to get the resource file and pass the resource file to the API supported by the generator to process the template file.

For example:

```typescript
const resourceMap = await material.find('templates/**/*');
```

All template files in the generator that match to the `templates /**/*` rules can be obtained in the above way, and the resource files can be operated by traversing the object.

### generator

Generator provides the function method of the codesmith runtime. Its type is defined as:

```typescript
interface GeneratorCore {
    logger: Logger;
    outputPath: string;
    output: {
        fs: (file: string | number, data: any, options?: string | fs.WriteFileOptions | undefined) => Promise<void>
    };
    runSubGenerator: (subGenerator: string, relativePwdPath?: string | undefined, config?: Record<string, any> | undefined): Promise<void>
}
```

The outputPath and the `materials.default` in the context point to the same directory, the outputPath is used to directly calculate the target path and operate, and the `materials.default` is used to obtain resource files.


`runSubGenerator` provides a way to run other microgenerators in one microgenerator, which will automatically update and maintain new context information.

## Template File

Generator template file.

It is recommended to create a templates directory in the project root directory to maintain the template file of the microgenerator. During the execution of the microgenerator, you can only use your own template file. For template files that need to be shared, it is recommended to use a shared sub-generator implementation.
