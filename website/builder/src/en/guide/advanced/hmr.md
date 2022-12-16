# Hot Module Replacement

Hot Module Replacement (or HMR) allows all kinds of modules to be updated at runtime without the need for a full refresh.

## Enabling HMR

Builder has built-in support for HMR. By default, HMR is enabled in development.

By setting `dev.hmr` to false, HMR can be disabled, which the HMR and react-refresh will no longer work.

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

## FAQ

### hmr not work when external react/reactDom?

HMR work requires the development mode of react & react-dom. The cdn version of react normally used the production mode.
You need to switch to development mode or make it not external when development.

If you're not sure which React mode you're using, you can see: [Check React Mode](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)
