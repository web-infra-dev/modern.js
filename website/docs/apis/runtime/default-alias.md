---
sidebar_position: 1
---

# 默认别名

:::tip 提示
- 除了以下默认别名，开发者可以在 `modern.config.js` 中自定义别名，详见[如何配置别名](/docs/apis/config/source/alias)。
:::


Modern.js 推荐通过别名的方式引用源码，其中包含 3 种默认别名:
- `@/`：等价于引用项目根目录 `src/*` 下的文件。
- `@api/`：等价于引用项目根目录下 `api/*` 下的文件（需要先开启 BFF 功能）。
- `@shared/`：等价于引用项目根目录下 `shared/*` 下的文件。


## 示例
下面的例子展示了如何通过默认别名引用函数。
```tsx
import { hello } from '@/common/utils';

hello();

```
引用 `@/common/utils` 相当于引用 `src/common/utils`。
