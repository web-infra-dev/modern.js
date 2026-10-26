import { Version } from '../shared/serverReload';

export default {
  middlewares: [
    {
      name: 'server-reload',
      handler: async (
        c: { res: Response },
        next: () => Promise<void>,
      ): Promise<void> => {
        await next();
        c.res.headers.set('x-server-reload', Version.Current);
      },
    },
  ],
};
