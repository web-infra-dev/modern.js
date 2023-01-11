- Type : `'linked' | 'inline' | 'none'`
- Default: `'linked'`

配置 legal comment 的处理方式。

legal comment 是 JS 或 CSS 文件中的一些特殊注释，这些注释包含 `@license` 或 `@preserve`，或是以 `//!` 开头。默认情况下，这些注释保留在输出文件中，因为这遵循了代码原作者的意图。

你可以通过 `legalComments` 来配置相关行为：

- `linked`：将所有 legal comments 移至 .LEGAL.txt 文件并通过注释链接到它们。
- `inline`：保留所有 legal comments。
- `none`：移除所有 legal comments。

#### 示例

移除所有 legal comments。

```js
export default {
  output: {
    legalComments: 'none',
  },
};
```
