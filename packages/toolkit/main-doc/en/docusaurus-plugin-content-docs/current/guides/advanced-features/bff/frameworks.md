---
sidebar_position: 3
title: Frameworks
---

Modern.js's BFF supports different runtime frameworks, currently Modern.js's BFF supports two runtime frameworks[Express.js](https://expressjs.com/) 和 [Koa.js](https://koajs.com/).

## Function Writing

Under the function writing, only the middleware writing method of various runtime frameworks is different, and other implementations are basically the same. Take Express as an example to introduce how to write a middleware by hand in the `api/_ app.ts` and add permission verification:

```ts
import { hook } from '@modern-js/runtime/server';
import { Request, Response, NextFunction } from 'express';

export default hook(({ addMiddleware }) => {
  addMiddleware(async (req: Request, res: Response, next: NextFunction) => {
    if (req.url !== '/api/login') {
      const sid = req?.cookies?.sid;
      if (!sid) {
        res.status(400);
        res.json({ code: -1, message: 'need login' });
      } else {
        next();
      }
    } else {
      next();
    }
  });
});
```

然后添加一个普通的 BFF 函数 `/api/hello.ts`:

```ts
export default async () => {
  return 'Hello Modern.js';
};
```

Finally, add the access code of the interface in the front-end `src/App.tsx`, and call it directly in an integrated way:

```ts
import { useState, useEffect } from 'react';
import { get as hello } from '@api/hello';

export default () => {
  const [text, setText] = useState('');

  useEffect(() => {
    async function fetchMyApi() {
      const { message } = await hello();
      setText(message);
    }

    fetchMyApi();
  }, []);

  return <p>{text}</p>;
};
```

Then exec `pnpm run dev` starts the project, and accessing `http://localhost:8080/` will find that the request for'/api/hello 'is blocked:

![Network](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/network2.png)

Finally, modify the front-end code `src/App.tsx` to call the login interface before accessing `/api/hello`:

```ts
import { useState, useEffect } from 'react';
import { get as hello } from '@api/hello';
import { post as login } from '@api/login';

export default () => {
  const [text, setText] = useState('');

  useEffect(() => {
    async function fetchAfterLogin() {
      const { code } = await login();
      if (code === 0) {
        const { message } = await hello();
        setText(message);
      }
    }
    fetchAfterLogin();
  }, []);

  return <p>{text}</p>;
};
```

Refresh the page and you can see that `/api/hello` was accessed successfully:

![Network](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/network3.png)

The above code simulates the way to add middleware to the `/api/_app.ts` to achieve an easy login function. Also, other functions can be implemented in this hook file to extend BFF Server.

## Framework Writing

Under the framework writing, Modern.js does not collect middleware in the `api/_app.ts`, and the running process is controlled by the plugin itself.

### Express

The framework writing of Express supports defining the startup logic of API Server in `api/app.[tj]s`. performing the initialization work of the application, adding global middleware, declaring routes, and even extending the original framework.

The route defined by the BFF function will be registered after the route defined by the `app.ts` file, so here you can also intercept the route defined by the BFF function, preprocess or respond in advance.

```ts title="api/app.ts"
import express from 'express';

const app = express();

app.put('/user', function (req, res) {
  res.send('Got a PUT request at /user');
});

app.use(async (req, res, next) => {
  console.info(`access url: ${req.url}`);
  next();
});

export default app;
```

### Koa

The Koa framework is written in a similar way to Express. It supports defining the startup logic of API Server in `app.[tj]s`, performing the initialization work of the application, adding global middleware, declaring routes, extending the original framework, etc.

The route defined by the BFF function will be registered after the route defined by the `app.ts` file, so here you can also intercept the route defined by the BFF function, preprocess or respond in advance.

:::caution
Use the framework writing, when there is no `app.ts`, Modern.js will add koa-body by default. When there is `app.ts`, if the developer wants to use the BFF function with Body, he needs to ensure that the koa-body middleware has been added.
:::

```ts title=api/app.ts
import koa from 'koa';

const app = new Koa();

app.put('/user', function (req, res) {
  res.send('Got a PUT request at /user');
});

app.use(async (ctx, next) => {
  console.info(`access url: ${ctx.url}`);
  await next();
});

export default app;
```
