---
sidebar_position: 6
---

# @modern-js/codesmith-api-ejs

An API wrapper for file operations using [ejs] (https://ejs.co/) in microgenerators, providing a way to render individual template files and folders.

## Use

```typescript
import { EjsAPI } from '@modern-js/codesmith-api-ejs';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const ejsAPI = new EjsAPI(generator);
  await ejsAPI.renderTemplate(
     material.get('templates/a.js'),
     target: 'b.js',
     { data: "data" }
   );
}
```

- Create EjsAPI instance, the parameter is the generator of the microgenerator function parameter, please see the composition of the microgenerator project for details.
- Just call the API on its example.

## API

### renderTemplate

Render a single template file.

Parameter:

- templateResource: `FsResource`. Template file resource, used by  `context.materials.get(<filename>)`.
- target: `string`. Target file path name.
- parameters?: `Record<string, string>`. Render parameter.

### renderTemplateDir

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
