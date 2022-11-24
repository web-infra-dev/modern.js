---
title: useModuleApps
---

Returns the React components of all micro-front-end sub-applications for freely controlled routing.

## Usage

```tsx
import { useModuleApps } from '@modern/plugin-garfish';
```

:::info Turn on
This API is used in the main application of micro frontend, please execute `pnpm run new` to turn on the micro frontend function first.

```bash
pnpm run new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「微前端」模式
```
:::

## Function Signature

`function useModuleApps(): Record<string, React.FC<any>>`

Returns the React components wrapped around each subapp.

## Example

You need to configure the micro-front-end sub-application information first.

```ts title=modern.config.js
module.exports = {
  runtime: {
    features:{
      masterApp: {
        apps: [
          {
            name: 'Home',
            entry: 'http://www.home.com'
          },
          {
            name: 'Contact',
            entry: 'http://www.contact.com'
          },
        ]
      }
    }
  }
}
```

```tsx title=App.tsx
function App() {
  const { Components: { Home, Contact } } = useModuleApps();

  return <div>
    Master APP
    <Route exact path='/home'>
      <Home />
    </Route>
    <Route exact path='/home'>
      <Contact />
    </Route>
  </div>;
}
```

Get the `Home` and `Contact` sub-application components(the same as name in the config) through `useModuleApps()`. After that, you can load the child application just like a normal React component.


## Load Animation

The transition animation of the component loading process can be customized in the following ways.

```tsx title=App.tsx
function App() {
  const { Components: { Home } } = useModuleApps();

  return <div>
    Master APP
    <Route exact path='/home'>
      <Home
        loadable={{
          loading: ({ pastDelay, error }: any) => {
            if (error) {
              console.error(error);
              return <div>error: {error?.message}</div>;
            } else if (pastDelay) {
              return <div>loading</div>;
            } else {
              return null;
            }
          },
        }}
      />
    </Route>
  </div>;
}
```
