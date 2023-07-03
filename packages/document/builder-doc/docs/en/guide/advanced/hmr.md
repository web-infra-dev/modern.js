# Hot Module Replacement

Hot Module Replacement (HMR) exchanges, adds, or removes modules while an application is running, without a full reload. This can significantly speed up development in a few ways:

- Retain application state which is lost during a full reload.
- Save valuable development time by only updating what's changed.
- Instantly update the browser when modifications are made to CSS/JS in the source code, which is almost comparable to changing styles directly in the browser's dev tools.

## Enabling HMR

Builder has built-in support for HMR. By default, HMR is enabled in development.

By setting [dev.hmr](/en/api/config-dev.html#devhmr) to false, HMR can be disabled, which the HMR and react-refresh will no longer work.

```ts
export default {
  dev: {
    hmr: false,
  },
};
```

## Specify HMR URL

By default, Builder uses the host and port number of the current page to splice the WebSocket URL of HMR.

When the HMR connection fails, you can specify the WebSocket URL by customizing `devServer.client` configuration.

### Default Config

The default config are as follows, Builder will automatically deduce the URL of the WebSocket request according to the current location:

```ts
export default {
  tools: {
    devServer: {
      client: {
        path: '/webpack-hmr',
        // Equivalent to port of the dev server
        port: '',
        // Equivalent to location.hostname
        host: '',
        // Equivalent to location.protocol === 'https:' ? 'wss' : 'ws'
        protocol: '',
      },
    },
  },
};
```

### Proxy

If you are proxying an online page to local development, WebSocket requests will fail to connect. You can try configuring `devServer.client` to the following values so that HMR requests can reach the local Dev Server.

```ts
export default {
  tools: {
    devServer: {
      client: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
  },
};
```

## Live reloading vs Hot reloading

- Live reloading: After modifying the file, webpack recompiles and forces a browser refresh, which is a global (application-wide) refresh, equivalent to `window.location.reload()`.
- Hot reloading: After modifying the file, webpack recompiles the corresponding module and remembers the state of the application when it is refreshed, thus enabling a partial refresh, i.e. hot update.

DevServer provides two configuration options, [hot](/en/api/config-tools.html#hot) and [liveReload](/en/api/config-tools.html#livereload), to control how updates are made. When both hot and liveReload are open, DevServer will attempt to use hot mode (HMR) first, and will degrade to reloading the page if the HMR update fails.

## FAQ

Please refer to [HMR FAQ](/guide/faq/hmr).
