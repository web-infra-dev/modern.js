Modern.js provides out-of-the-box global proxy plugin `@modern-js/plugin-proxy`, which is based on [whistle](https://github.com/avwo/whistle) and can be used to view and modify HTTP/HTTPS requests and responses, and can also be used as an HTTP proxy server.

### Set Proxy Rules

After install the proxy plugin and filling in the rules, execute `pnpm run dev`, Modern.js will automatically enable the proxy server after the development server starts.

Specific proxy rules can be set via the [`dev.proxy`](/docs/configure/app/dev/proxy) or the `config/proxy.js` file.

### Use Proxy Dashboard

After exec `pnpm run dev` command:

```bash
  App running at:

  Local:    http://localhost:8080/
  Network:  http://192.168.0.1:8080/

ℹ  info      Starting the proxy server.....
✔  success   Proxy Server start on localhost:8899
```

In the console you can see that the proxy server started successfully.

Accessing the `http://localhost:8899` and, you can set the rules through the dashboard.

![debug-proxy-ui](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/debug/debug-proxy-ui.png)
