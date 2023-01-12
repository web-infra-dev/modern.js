# 引用 JSON 文件

Builder 支持在代码中引用 JSON 文件，也支持引用 [YAML](https://yaml.org/) 和 [TOML](https://toml.io/en/) 文件并将其转换为 JSON 格式。

## JSON 文件

你可以直接在 JavaScript 文件中引用 JSON 文件。

### 示例

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

### 具名引用

Builder 暂不支持通过 named import 来引用 JSON 文件：

```js
import { name } from './example.json';
```

## YAML 文件

YAML 是一种数据序列化语言，通常用于编写配置文件。

你可以直接在 JavaScript 中引用 `.yaml` 或 `.yml` 文件，它们会被自动转换为 JSON 格式。

### 示例

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

### 添加类型声明

当你在 TypeScript 代码中引用 YAML 文件时，请在项目中创建 `src/global.d.ts` 文件，并添加相应的类型声明：

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

## TOML 文件

TOML 是一种语义明显、易于阅读的配置文件格式。

你可以直接在 JavaScript 中引用 `.toml` 文件，它会被自动转换为 JSON 格式。

### 示例

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

### 添加类型声明

当你在 TypeScript 代码中引用 TOML 文件时，请在项目中创建 `src/global.d.ts` 文件，并添加相应的类型声明：

```ts
// src/global.d.ts
declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}
```
