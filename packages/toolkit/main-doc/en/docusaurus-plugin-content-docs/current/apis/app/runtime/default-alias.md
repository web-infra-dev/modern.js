---
sidebar_position: 1
title: Default Alias
---

Modern.js recommend referring to the source code by alias, which contains 3 default aliases:
- `@/`: the file under the project root directory `src/* `.
- `@api/`: the file under the `api/*` in the project root directory (you need to enable the BFF first).
- `@shared/`: the file under the project root directory `shared/* `.

:::tip
In addition, developers can customize aliases in modern.config.js, see [Aliases](/docs/configure/app/source/alias) for detail.
:::


## Example

The following example shows how to reference a function by default alias.

```tsx
import { hello } from '@/common/utils';

hello();
```
A reference to `@/common/utils` is equal to a reference to `src/common/utils`.
