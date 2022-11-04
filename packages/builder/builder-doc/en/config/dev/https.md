- Type: `boolean | { key: string; cert: string }`
- Default: `false`

After configuring this option, you can enable HTTPS Dev Server, and disabling the HTTP Dev Server.

HTTP:

```bash
  > Local: http://localhost:8080/
  > Network: http://192.168.0.1:8080/
```

HTTPS:

```bash
  > Local: https://localhost:8080/
  > Network: https://192.168.0.1:8080/
```

#### Automatically generate certificates

You can directly set `https` to `true`, Builder will automatically generate the HTTPS certificate based on [devcert](https://github.com/davewasmer/devcert).

```ts
export default {
  dev: {
    https: true,
  },
};
```

The devcert has some limitations, it does not currently support IP addresses yet.

:::tip
The https proxy automatically installs the certificate and needs root authority, please enter the password according to the prompt.
**The password is only used to trust the certificate, and will not be leaked or be used elsewhere**.
:::

#### Manually set the certificate

You can also manually pass in the certificate and the private key required in the `dev.https` option. This parameter will be directly passed to the createServer method of the https module in Node.js.

For details, please refer to [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener).

```ts
import fs from 'fs';

export default {
  dev: {
    https: {
      key: fs.readFileSync('certificates/private.pem'),
      cert: fs.readFileSync('certificates/public.pem'),
    },
  },
};
```
