# Hot Module Replacement

Hot Module Replacement (HMR) exchanges, adds, or removes modules while an application is running, without a full reload. This can significantly speed up development in a few ways:

- Retain application state which is lost during a full reload.
- Save valuable development time by only updating what's changed.
- Instantly update the browser when modifications are made to CSS/JS in the source code, which is almost comparable to changing styles directly in the browser's dev tools.

## Enabling HMR

Builder has built-in support for HMR. By default, HMR is enabled in development.

By setting [dev.hmr](/en/api/config-dev.html#dev-hmr) to false, HMR can be disabled, which the HMR and react-refresh will no longer work.

```ts
export default {
  dev: {
    hmr: false,
  },
};
```

## Specify HMR URL

By default, builder get HMR client URL by local-ip and current port.

In the event of a connection failure you can specify an available URL by custom configuration.

For example, set HMR client and port empty to auto derived from browser:

```ts
export default {
  tools: {
    devServer: {
      client: {
        host: '',
        port: '',
      },
    },
  },
};
```

## Live reloading vs Hot reloading

- Live reloading: After modifying the file, webpack recompiles and forces a browser refresh, which is a global (application-wide) refresh, equivalent to `window.location.reload()`.
- Hot reloading: After modifying the file, webpack recompiles the corresponding module and remembers the state of the application when it is refreshed, thus enabling a partial refresh, i.e. hot update.

DevServer provides two configuration items, [hot](/en/api/config-tools.html#hot) and [liveReload](/en/api/config-tools.html#livereload), to control how updates are made. When both hot and liveReload are open, DevServer will attempt to use hot mode (HMR) first, and will degrade to reloading the page if the HMR update fails.

## FAQ

### HMR not work when external react/reactDom?

HMR work requires the development mode of react & react-dom. The cdn version of react normally used the production mode.
You need to switch to development mode or make it not external when development.

If you're not sure which React mode you're using, you can see: [Check React Mode](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)

### HMR not work when use https?

When https is enabled, the HMR perhaps connection fail due to a certificate issue, and if you open the console, you will get an HMR connect failed error.

![hmr-connect-error-0](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/img_v2_2f90d027-a232-4bd8-8021-dac3c651682g.jpg)

The solution to this problem is to click on "Advanced" -> "Proceed to xxx (unsafe)" on the Chrome problem page.

![hmr-connect-error-1](https://lf3-static.bytednsdoc.com/obj/eden-cn/6221eh7uhbfvhn/modern/3d2d4a38-acfe-4fe2-bdff-48b3366db481.png)

> Tips: When accessing the page through Localhost, the words "Your connection is not private" may not appear and can be handled by visiting the Network domain.

### React component state lost after HMR?

Builder uses React's official [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin) capability for component hot update.

When using Fast Refresh, it is required that the component cannot be an anonymous function, otherwise the state of the React component cannot be preserved after hot update.

The following spellings are incorrect:

```js
// wrong spelling 1
export default function () {
  return <div>Hello World</div>;
}

// wrong spelling 2
export default () => <div>Hello World</div>;
```

The correct spelling is:

```js
// Correct spelling 1
export default function MyComponent() {
  return <div>Hello World</div>;
}

// Correct spelling 2
const MyComponent = () => <div>Hello World</div>

export default MyComponent;
```
