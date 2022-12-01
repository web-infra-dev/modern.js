---
sidebar_position: 3
---

# @modern-js/codesmith-api-fs

API wrapper for file operations in microgenerators, providing methods to render individual template files and folders. FsAPI is usually used to handle binaries or template files that cannot be handled with handlebars, ejs.

## Use

```typescript
import { FsAPI } from '@modern-js/codesmith-api-fs';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const handlebarApi = new HandlebarsAPI(generator);
  await handlebarsAPI.renderFile(
     material.get('templates/a.js'),
     target: 'b.js'
   );
}
```

- Create FsAPI instance, the parameter is the generator of the microgenerator function parameter, please see the composition of the microgenerator project for details.
- Just call the API on its example.

## API

### renderFile

Render a single template file.

Parameter:

- resource: `FsResource`. Template file resource, used by  `context.materials.get(<filename>)`.
- target: `string`. Target file path name.

### renderDir

Render template folder.

Parameter:

- material: `FsMaterial`. The material context of the current microgenerator execution.
- findGlob: `string`. Template file matches the regular.
- target: `(globMatch: string) => string`. The target file path generation function, the parameter is `resourceKey.`
- options?: `RenderTemplateDirOptions`. Glob Find the file configuration, the specific function viewable is here [glob] (https://www.npmjs.com/package/glob).

```typescript
type RenderTemplateDirOptions = {
  nodir?: boolean;
  dot?: boolean;
  ignore?: string | readonly string[];
};
```
