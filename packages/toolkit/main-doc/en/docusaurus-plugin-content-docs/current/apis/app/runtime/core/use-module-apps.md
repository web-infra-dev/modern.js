---
title: useModuleApps
---

Returns the React components of all micro-front-end sub-applications for freely controlled routing.

## Usage

```tsx
import { useModuleApps } from '@modern-js/plugin-garfish/runtime';
```

## Function Signature

`function useModuleApps(): Record<string, React.FC<any>>`

Returns the React components wrapped around each subapp.

## Example

You need to configure the micro-front-end sub-application information first.

import EnableMicroFrontend from '@site-docs-en/components/enable-micro-frontend.md';

<EnableMicroFrontend />

```tsx title=App.tsx
function App() {
  const { Home, Contact } = useModuleApps();

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

defineConfig(App, {
  masterApp: {
    apps: [
      {
        // name 区分大小写，name 提供的是什么 useModuleApps 返回的就是什么
        name: "Home",
        entry: "http://127.0.0.1:8081/"
      },
      {
          name: "Contact",
          entry: "http://localhost:8082"
      }
    ]
  }
})
```

Get the `Home` and `Contact` sub-application components(the same as name in the config) through `useModuleApps()`. After that, you can load the child application just like a normal React component.


### Centralized Routing

**Centralized Routing** is a way to centrally configure the activation routes of sub-applications. 我add `activeWhen` config to enable **Centralized Routing**。

import MicroRuntimeConfig from '@site-docs-en/components/micro-runtime-config.md';

<MicroRuntimeConfig />

Then use the `useModuleApp` method to get the `MApp` component in the main application, and render the `MApp` in the main application.

```tsx title=main: App.tsx
import { useModuleApp } from '@modern-js/plugin-runtime';

function App() {
  const { MApp } = useModuleApps();

  return <div>
    <MApp />
  </div>
}

defineConfig(App, {
  masterApp: {
    apps: [
      {
        // name is case sensitive, what name provides is what useModuleApps returns
        name: "Dashboard",
        activeWhen: '/dashboard',
        entry: "http://127.0.0.1:8081/"
      },
      {
        name: "TableList",
        activeWhen: '/table',
        entry: "http://localhost:8082"
      }
    ]
  }
})
```

After starting the application in this way, accessing the `/dashboard` route will render the `Dashboard`, and accessing the `/table` route will render the `TableList`.

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
