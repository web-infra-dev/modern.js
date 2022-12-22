# Import JSON Files

Builder supports import JSON files in code, and also supports import [YAML](https://yaml.org/) and [Toml](https://toml.io/en/) files and converting them to JSON format.

## JSON file

You can import JSON files directly in JavaScript files.

### Example

```json
// example.json
{
  "name": "foo",
  "items": [1, 2]
}
```

```js
import example from './example.json';

console.log(example.name); // 'foo';
console.log(example.items); // [1, 2];
```

### Named Import

Builder does not support importing JSON files via named import yet:

```js
import { name } from './example.json';
```

## YAML file

YAML is a data serialization language commonly used for writing configuration files.

You can directly import `.yaml` or `.yml` files in JavaScript and they will be automatically converted to JSON format.

### Example

```yaml
# example.yaml
---
hello: world
foo:
  bar: baz
```

```js
import example from './example.yaml';

console.log(example.hello); // 'world';
console.log(example.foo); // { bar: 'baz' };
```

### Type declaration

## Add type declaration

When you import a YAML file in your TypeScript code, please create a `src/global.d.ts` file in your project and add the corresponding type declaration:

```ts
// src/global.d.ts
declare module '*.yaml' {
  const content: Record<string, any>;
  export default content;
}

declare module '*.yml' {
  const content: Record<string, any>;
  export default content;
}
```

## Toml file

Toml is a semantically explicit, easy-to-read configuration file format.

You can directly import `.toml` files in JavaScript and it will be automatically converted to JSON format.

### Example

```toml
# example.toml
hello = "world"

[foo]
bar = "baz"
```

```js
import example from './example.toml';

console.log(example.hello); // 'world';
console.log(example.foo); // { bar: 'baz' };
```

## Add type declaration

When you import Toml files in TypeScript code, please create a `src/global.d.ts` file in your project and add the corresponding type declarations:

```ts
// src/global.d.ts
declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}
```
