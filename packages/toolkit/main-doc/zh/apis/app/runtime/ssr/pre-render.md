---
title: PreRender
---

无展示内容的高阶组件，通过类似 Helmet 的方式实现 SPA 路由级的缓存，无需额外配置。

## 使用姿势

```tsx
import { PreRender } from '@modern-js/runtime/ssr';

export default () => (
  <>
    <PreRender interval={5} />
  </>
)
```

## 函数签名

`PreRender` 组件提供了一套常用的配置参数，用于控制缓存的规则、过期时间、缓存算法等。

```tsx
type Props {
  interval: number;
  staleLimit: number;
  level: number;
  include: { header?: string[], query?: string[] };
  matches: { header?: Record<string, any>, query?: Record<string, any> }
}

function PreRender(props: Props): React.Component
```

### 参数

- `interval`：设置缓存保持新鲜的时间，单位秒。在该时间内，将直接使用缓存，并且不做异步渲染。
- `staleLimit`：设置缓存完全过期的时间，单位秒。在该时间内，缓存可以被返回，否则必须使用重新渲染的结果。
- `level`：设置缓存标识的计算规则等级，通常配合 `includes` 与 `matches` 使用。默认值为 `0`。

```bash
0：路由路径
1：路由路径 + 查询字符串
2：路由路径 + 请求头
3：路由路径 + 查询字符串 + 请求头
```

- `includes`：设置需要被纳入缓存标识的内容，在 level 非 0 时使用。默认值为 `null`。
- `matches`：设置 query 或 header 的值在缓存标识计算中的重写规则，通常用在缓存分类时，支持正则表达式。默认值为 `null`。

## 示例

```tsx
import { PreRender } from '@modern-js/runtime/ssr';

export default function App() {
  return (
    <>
        <PreRender interval={10} />
        <div>Hello Modern</div>
    </>
  )
}
```

下面例子展示了如何将 query、header 中指定的参数纳入缓存计算中：

```tsx
/* 使用 query 中的 channel 和 header 中的 language 计算缓存标识 */
<PreRender interval={10} level={2} includes={{
    query: ["channel"],
    header: ["language"]
}} />
```

下面例子展示了如何不让测试频道影响线上缓存：

```tsx
/* 将 query 中 channel 值为 test_ 开头的重写为 testChannel，否则重写为 otherChannel */
<PreRender interval={10} level={2} includes={{
    query: ["channel"],
    header: ["language"]
}} matches={{
    query: {
        channel: {
            "testChannel", "^test_",
            "otherChannel", ".*"
        }
    }
}} />
```
