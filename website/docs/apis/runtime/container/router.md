---
title: router
sidebar_position: 5
---

:::info 补充信息
基于 [react-router](https://reactrouter.com/web/guides/start) 的路由解决方案。
:::

:::caution 注意
使用该 API 前，请确认没有禁用 [router 插件](#)。
:::

## hooks

### useHistory

```ts
function useHistory<HistoryLocationState = H.LocationState>(): H.History<HistoryLocationState>;
```

用于获取 `history` 实例。

```tsx
import { useHistory } from "@modern-js/runtime/router";

export function HomeButton() {
  let history = useHistory();

  function handleClick() {
    history.push("/home");
  }

  return (
    <button type="button" onClick={handleClick}>
      Go home
    </button>
  );
}
```

### useLocation

```ts
function useLocation<S = H.LocationState>(): H.Location<S>;
```

`useLocation` 返回当前 url 对应的 [location](https://reactrouter.com/web/api/location) 对象。每当路由更新的时候，都会拿到一个新的 `location` 对象。

```ts
import React from "react";
import { bootstrap, createApp } from '@modern-js/runtime';
import { router } from '@modern-js/runtime/plugins';
import {
  BrowserRouter as Router,
  Switch,
  useLocation
} from "@modern-js/runtime/router";

function usePageViews() {
  let location = useLocation();
  React.useEffect(() => {
    ga.send(["pageview", location.pathname]);
  }, [location]);
}

function App() {
  usePageViews();
  return <Switch>...</Switch>;
}
```

### useParams

```ts
function useParams<
  Params extends {
    [K in keyof Params]?: string
  } = {}
>(): Params;
```

`useParams` 返回一个 key/value 的键值对表示路由中的参数信息。它等同于 `<Route >` 组件中的 `match.params` 值。

```tsx
import React from "react";
import {
  Switch,
  Route,
  useParams
} from "@modern-js/runtime/router";

function BlogPost() {
  const { slug } = useParams();
  return <div>Now showing post {slug}</div>;
}

function App() {
  return <Switch>
    <Route exact path="/">
      <div>home</div>
    </Route>
    <Route path="/blog/:slug">
      <BlogPost />
    </Route>
  </Switch>
}
```

### useRouteMatch

```ts
function useRouteMatch<
  Params extends { [K in keyof Params]?: string } = {}
>(): match<Params>;

function useRouteMatch<
  Params extends { [K in keyof Params]?: string } = {}
>(
  path: string | string[] | RouteProps,
): match<Params> | null;
```

`useRouteMatch` 和 `<Route />` 一样是对路由进行匹配，但无须去渲染 `<Route />` 组件，便能获取到当前匹配结果。

## 组件



### Link

```ts
interface Link<S = H.LocationState>
  extends React.ForwardRefExoticComponent<
    React.PropsWithoutRef<LinkProps<S>> & React.RefAttributes<HTMLAnchorElement>
> {}
```

可以使用 `Link` 组件进行路由跳转。

```ts
<Link to="/about">About</Link>
```

#### LinkProps

**to**

类型：`string | object | function`

`string`

```ts
<Link to="/courses?sort=name" />
```

`object`

```tsx
<Link
  to={{
    pathname: "/courses",
    search: "?sort=name",
    hash: "#the-hash",
    state: { fromDashboard: true }
  }}
/>
```

`function`

```tsx
<Link to={location => ({ ...location, pathname: "/courses" })} />

<Link to={location => `${location.pathname}?sort=name`} />
```

**replace**

类型：`boolean`

当设置为 `true` 时，在跳转的时候替换掉 history 栈中的栈顶路由，而不是添加一个新路由。

**component**

类型：`Component`

如果你想自定义你自己的路由跳转的组件，可以通过传入 `component` 来实现。

```tsx
 simply do so by passing it through the component prop.const FancyLink = React.forwardRef((props, ref) => (
  <a ref={ref} {...props}>💅 {props.children}</a>
))

<Link to="/" component={FancyLink} />
```

### NavLink

```ts
interface NavLink<S = H.LocationState>
  extends React.ForwardRefExoticComponent<
    React.PropsWithoutRef<NavLinkProps<S>> & React.RefAttributes<HTMLAnchorElement>
> {}
```

`NavLink` 是一种特殊的 [Link](#link) 组件，当 `NavLink` 对应路由匹配到当前 `url`, 会给 `NavLink` 所渲染的元素添加一些额外的样式。


#### NavLinkProps

**activeClassName**

类型：`string`

设置路由匹配时额外 class。

```tsx
<NavLink to="/faq" activeClassName="selected">
  FAQs
</NavLink>
```

**activeStyle**

类型：`object`

设置路由匹配时额外的样式。

```tsx
<NavLink
  to="/faq"
  activeStyle={{
    fontWeight: "bold",
    color: "red"
  }}
>
  FAQs
</NavLink>
```

**exact**

类型：`boolean`


**strict**

类型：`boolean`

**isActive**

类型：`function`

如果你想自定义当前 Link 是否激活的逻辑，可以使用 `isActive`。

```tsx
<NavLink
  to="/events/123"
  isActive={(match, location) => {
    if (!match) {
      return false;
    }

    // only consider an event active if its event id is an odd number
    const eventID = parseInt(match.params.eventID);
    return !isNaN(eventID) && eventID % 2 === 1;
  }}
>
  Event 123
</NavLink>
```

**location**

类型：`object`

`NavLink` 默认会和当前的 `history.location` 进行匹配，判断是否处于激活状态。如果你想指定要匹配的 `location` 对象，可以使用该参数。

**area-current**

类型：`string`

参考 [aria-current](https://www.w3.org/TR/wai-aria-1.1/#aria-current)



### Prompt

```ts
interface PromptProps {
    message: string | ((location: H.Location, action: H.Action) => string | boolean);
    when?: boolean;
}

class Prompt extends React.Component<PromptProps, any> {}
```

`Prompt` 组件可用于在页面跳转前，进行二次确认是否跳转。

```tsx
<Prompt
  when={formIsHalfFilledOut}
  message="Are you sure you want to leave?"
/>
```

#### PromptProps

**message**

类型：`string` | `function`

在页面跳转前的二次确认提示信息，支持传入函数形式。

```tsx
<Prompt
  message={(location, action) => {
    if (action === 'POP') {
      console.log("Backing up...")
    }

    return location.pathname.startsWith("/app")
      ? true
      : `Are you sure you want to go to ${location.pathname}?`
  }}
/>
```

**when**

类型：`boolean`

当 `when` 为 `true` 时，才会在页面跳转前展示二次确认提示。


### Route

```ts
interface RouteProps<
  Path extends string = string,
  Params extends { [K: string]: string | undefined } = ExtractRouteParams<Path, string>
> {
  location?: H.Location;
  component?: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
  render?: (props: RouteComponentProps<Params>) => React.ReactNode;
  children?: ((props: RouteChildrenProps<Params>) => React.ReactNode) | React.ReactNode;
  path?: Path | Path[];
  exact?: boolean;
  sensitive?: boolean;
  strict?: boolean;
}

class Route<T extends {} = {}, Path extends string = string> extends React.Component<
  RouteProps<Path> & OmitNative<T, keyof RouteProps>,
  any
> {}
```

`Route` 组件用于定义路由。

#### component

类型：`React.ComponentType`

当路由匹配成功，会渲染传入 `component` 的组件。

```tsx
import React from "react";
import { Route } from "@modern-js/runtime/router";

// All route props (match, location and history) are available to User
function User(props) {
  return <h1>Hello {props.match.params.username}!</h1>;
}

function App() {
  return <Route path="/user/:username" component={User} />;
}
```

:::tip 提示
如果 component 是一个 inline function，如 `<Route path="/user/:username" component={() => 'hello'} />`，因为每次 rerender 的时候，component 都会是一个新的 `type`，所以 component 组件会先 unmount，再 mount。我们需要避免这种写法，或者使用 render 代替 component。
:::

#### render

类型：`(props: RouteComponentProps<Params>) => React.ReactNode`

允许使用 `inline function` 进行渲染，同时不会有 `component` remounting 的问题。

```tsx
import React from "react";
import { Route } from "@modern-js/runtime/router";

function App() {
  <Route path="/home" render={() => <div>Home</div>} />
}
```

:::info 注
component 的优先级高于 render。
:::

#### children

类型：`((props: RouteChildrenProps<Params>) => React.ReactNode) | React.ReactNode`

如果在路由匹配或不匹配的情况下，都需要渲染一些内容，那么可以使用 `children` 参数。

```tsx
function ListItemLink({ to, ...rest }) {
  return (
    <Route
      path={to}
      children={({ match }) => (
        <li className={match ? "active" : ""}>
          <Link to={to} {...rest} />
        </li>
      )}
    />
  );
}

function App() {
  return <ul>
    <ListItemLink to="/somewhere" />
    <ListItemLink to="/somewhere-else" />
  </ul>;
}
```

#### path

类型：`string | string[]`

符合 [path-to-regexp@^1.7.0](https://github.com/pillarjs/path-to-regexp/tree/v1.7.0) 匹配规则的 url 字符串或数组。

```tsx
<Route path="/users/:id">
  <User />
</Route>

<Route path={["/users/:id", "/profile/:id"]}>
  <User />
</Route>
```

#### exact

类型：`boolean`

默认值：`false`

当 `exact` 值为 `true` 时，会进行准确匹配。

|  path   | location.pathname | exact | matches? |
|  -  | -  | - | - |
| /one  | /one/two	 | true  | no  |
| /one  | /one/two	 | false | yes |


#### strict

类型：`boolean`

默认值：`false`

当 `strict` 值为 `true` 时，会进行严格匹配。若 `path` 以 '/' 结尾，那么 `location.pathname` 也需要以 '/' 结尾，才能匹配。

|  path   | location.pathname | matches? |
|  -  | - | - |
| /one/  | /one  | no  |
| /one/  | /one/ | yes |
| /one/| /one/two | yes |

#### sensitive

类型：`boolean`

默认值：`false`

当 `sensitive` 设置为 `true`，则 path 大小写不敏感。

#### location

类型：`object`

## 更多底层 API

若想要了解更多的底层 API 信息，可至 [react-router 官网](https://reactrouter.com/web/guides/start) 查看。

