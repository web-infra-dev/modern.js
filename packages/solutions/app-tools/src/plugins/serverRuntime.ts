import { isPackageInstalled } from '@modern-js/utils';
import type { AppTools, CliPlugin } from '../types';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-server-runtime',
  setup(api) {
    api.config(() => {
      const { appDirectory } = api.getAppContext();

      // Externalizing a package the app cannot resolve leaves a `require()` in
      // the SSR bundle pointing at a module Node will not find, so loading the
      // bundle throws and rendering silently degrades to CSR. Frameworks built
      // on top of Modern.js re-export this package under their own name, and
      // their apps depend on that wrapper instead, so the bare specifier is
      // only a transitive dependency and does not resolve from the app root.
      //
      // Leaving the copy bundled is safe: the hono request context lives on a
      // process-global AsyncLocalStorage, so a duplicated module still reads
      // the context the custom server wrote.
      if (!isPackageInstalled('@modern-js/server-runtime', appDirectory)) {
        return {};
      }

      return {
        output: {
          externals: [
            {
              '@modern-js/server-runtime': '@modern-js/server-runtime',
            },
          ],
        },
      };
    });
  },
});
