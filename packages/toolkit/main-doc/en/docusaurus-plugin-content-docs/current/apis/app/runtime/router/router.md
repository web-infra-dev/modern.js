---
title: router
sidebar_position: 1
---

:::info
The router solution based on [react-router 6](https://reactrouter.com/).
:::

## hooks

### useNavigate

```ts
declare function useNavigate(): NavigateFunction;

interface NavigateFunction {
  (
    to: To,
    options?: {
      replace?: boolean;
      state?: any;
      relative?: RelativeRoutingType;
    }
  ): void;
  (delta: number): void;
}
```

The `useNavigate` hook returns a function that lets you navigate programmatically。

```tsx
import { useNavigate } from "@modern-js/runtime/router";

export function HomeButton() {
  let navigate = useNavigate();

  function handleClick() {
    navigate("/home");
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
declare function useLocation(): Location;

interface Location extends Path {
  state: unknown;
  key: Key;
}
```

The `useLocation` hook returns the current [location](https://reactrouter.com/web/api/location) object. A new location object would be returned whenever the current location changes.

```ts
import { useLocation } from "@modern-js/runtime/router";

function usePageViews() {
  let location = useLocation();
  React.useEffect(() => {
    ga.send(["pageview", location.pathname]);
  }, [location]);
}

function App() {
  usePageViews();
  return (
    //...
  );
}
```

### useParams

```ts
declare function useParams<
  K extends string = string
>(): Readonly<Params<K>>;
```

The `useParams` hook returns an object of key/value pairs of the dynamic params from the current URL that were matched by the `<Route path>`.

```tsx
import {
  Routes,
  Route,
  useParams
} from "@modern-js/runtime/router";

function BlogPost() {
  const { slug } = useParams();
  return <div>Now showing post {slug}</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={ <div>home</div> } />
      <Route path="/blog/:slug" element={ <BlogPost />}/>
    </Routes>
  )
}
```

## Components

### Link

```ts
declare function Link(props: LinkProps): React.ReactElement;

interface LinkProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  > {
  replace?: boolean;
  state?: any;
  to: To;
  reloadDocument?: boolean;
}

type To = string | Partial<Path>;
```

A `<Link>` is an element that lets the user navigate to another page by clicking or tapping on it.

```ts
<Link to="/about">About</Link>
```

### NavLink

```ts
declare function NavLink(
  props: NavLinkProps
): React.ReactElement;

interface NavLinkProps
  extends Omit<
    LinkProps,
    "className" | "style" | "children"
  > {
  caseSensitive?: boolean;
  children?:
    | React.ReactNode
    | ((props: { isActive: boolean }) => React.ReactNode);
  className?:
    | string
    | ((props: {
        isActive: boolean;
      }) => string | undefined);
  end?: boolean;
  style?:
    | React.CSSProperties
    | ((props: {
        isActive: boolean;
      }) => React.CSSProperties);
}
```

A `<NavLink>` is a special kind of `<Link>` that knows whether or not it is "active".


### Outlet

```ts
interface OutletProps {
  context?: unknown;
}
declare function Outlet(
  props: OutletProps
): React.ReactElement | null;
```

An `<Outlet>` should be used in parent route elements to render their child route elements. This allows nested UI to show up when child routes are rendered.

```tsx
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* This element will render either <DashboardMessages> when the URL is
          "/messages", <DashboardTasks> at "/tasks", or null if it is "/"
      */}
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route
          path="messages"
          element={<DashboardMessages />}
        />
        <Route path="tasks" element={<DashboardTasks />} />
      </Route>
    </Routes>
  );
}
```

### Route

```ts
interface RouteObject {
  path?: string;
  index?: boolean;
  children?: React.ReactNode;
  caseSensitive?: boolean;
  id?: string;
  loader?: LoaderFunction;
  action?: ActionFunction;
  element?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  handle?: RouteObject["handle"];
  shouldRevalidate?: ShouldRevalidateFunction;
}
```

`Route` represents the route information. A `Route` object couples URL segments to components, data loading and data mutations.

`Route` can be used as a plain object, passing to the router creation functions：

```ts
const router = createBrowserRouter([
  {
    // it renders this element
    element: <Team />,

    // when the URL matches this segment
    path: "teams/:teamId",

    // with this data loaded before rendering
    loader: async ({ request, params }) => {
      return fetch(
        `/fake/api/teams/${params.teamId}.json`,
        { signal: request.signal }
      );
    },

    // performing this mutation when data is submitted to it
    action: async ({ request }) => {
      return updateFakeTeam(await request.formData());
    },

    // and renders this element in case something went wrong
    errorElement: <ErrorBoundary />,
  },
]);
```

You can also declare your routes with JSX and `createRoutesFromElements`, the props to the element are identical to the properties of the route objects:

```ts
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<Team />}
      path="teams/:teamId"
      loader={async ({ params }) => {
        return fetch(
          `/fake/api/teams/${params.teamId}.json`
        );
      }}
      action={async ({ request }) => {
        return updateFakeTeam(await request.formData());
      }}
      errorElement={<ErrorBoundary />}
    />
  )
);
```

## More

You can access to [React Router](https://reactrouter.com/) to get the full API information.


