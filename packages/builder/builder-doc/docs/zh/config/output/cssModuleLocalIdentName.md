- **类型：** `string`
- **默认值：**

```ts
// isProd 表示生产环境构建
const localIdentName = isProd
  ? '[hash:base64:5]'
  : '[path][name]__[local]--[hash:base64:5]';
```

设置 CSS Modules 编译后生成的 className 格式。

### 默认值

`cssModuleLocalIdentName` 在开发环境和生产环境有不同的默认值。

在生产环境，Builder 会生成更简短的类名，从而减少构建产物的体积。

```ts
import styles from './index.module.scss';

// 在开发环境下，值为 `.src-index-module__header--xxxxx`
// 在生产环境下，值为 `.xxxxx`
console.log(styles.header);
```

### 模板字符串

在 `cssModuleLocalIdentName` 中，你可以使用以下模板字符串：

- `[name]` - 源文件名称。
- `[local]` - 原始类名。
- `[hash]` - 字符串的哈希值。
- `[folder]` - 文件夹的相对路径。
- `[path]` - 源文件的相对路径。
- `[file]` - 文件名和路径。
- `[ext]` - 文件后缀名，包含点号。
- `[hash:<hashDigest>:<hashDigestLength>]` - 带有哈希设置的哈希。

### 示例

将 `cssModuleLocalIdentName` 设置为其他值：

```ts
export default {
  output: {
    cssModuleLocalIdentName: '[hash:base64:4]',
  },
};
```
