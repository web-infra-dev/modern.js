---
sidebar_position: 2
---

# @modern-js/codesmith-api-json

The JSON API encapsulation in the microgenerator provides common JSON file operation methods.

## Use

```typescript
import { JsonAPI } from '@modern-js/codesmith-api-json';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(
    context.materials.default.get('package.json'),
    {
      query: {},
      update: {
        $set: {
          'dependencies.@modern-js/plugin-bff': `^2.0.0`,
        },
      },
    },
  );
 }
```

- Create JsonAPI instance, the parameter is the generator of the microgenerator function parameter, please see the composition of the microgenerator project for details.
- Just call the API on its example.


## API

### get

Get the JSON file content.

Parameter:
- resource: `FsResource`. A file resource，get by `context.materials.default.get(<filename>)`.

### extend

Merge objects into a JSON file.

Parameter:

- resource: `FsResource`. A file resource，get by `context.materials.default.get(<filename>)`.
- obj: `Record<string, any>`. Object to be merged.

### update

pdate object fields to JSON file.

Parameter:

- resource: `FsResource`. A file resource，get by `context.materials.default.get(<filename>)`.
- operation: `{ query: Record<string, any>; update: Record<string, any> }`. Update operation, use gesture to view [declaration-update](https://www.npmjs.com/package/declaration-update) in detail.
