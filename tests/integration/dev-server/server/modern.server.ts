import { loadEsmOnly } from '../shared/esmImport';
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
    {
      name: 'esm-dynamic-import',
      handler: async (
        c: {
          req: { header: (name: string) => string | undefined };
          res: Response;
        },
        next: () => Promise<void>,
      ): Promise<void> => {
        await next();
        // Only tests/serverReload.test.ts installs the ESM-only packages.
        if (c.req.header('x-esm-import')) {
          c.res.headers.set('x-esm-import', await loadEsmOnly());
        }
      },
    },
  ],
};
