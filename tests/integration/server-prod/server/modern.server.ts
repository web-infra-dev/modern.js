type Context = {
  req: { path: string };
  res: Response;
  header: (name: string, value: string) => void;
};

export default {
  middlewares: [
    {
      name: 'cache-control-before-next',
      handler: async (c: Context, next: () => Promise<void>) => {
        if (c.req.path === '/upload/no-store.txt') {
          c.header('Cache-Control', 'private, no-store');
        }
        await next();
      },
    },
    {
      name: 'cache-control-after-next',
      handler: async (c: Context, next: () => Promise<void>) => {
        await next();
        if (c.req.path === '/after.txt') {
          c.res.headers.set('Cache-Control', 'public, max-age=60');
        }
      },
    },
  ],
};
