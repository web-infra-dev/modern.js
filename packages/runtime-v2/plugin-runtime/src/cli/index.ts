import { isReact18 } from '@modern-js/utils';
import type { CliPlugin, AppTools } from '@modern-js/app-tools-v2';

export const runtimePlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/runtime',
  post: [],
  // the order of runtime plugins is affected by runtime hooks, mainly `init` and `hoc` hooks
  usePlugins: [],
  setup: api => {
    return {
      config() {
        const appDir = api.useAppContext().appDirectory;
        process.env.IS_REACT18 = isReact18(appDir).toString();
        return {
          runtime: {},
          runtimeByEntries: {},
          source: {
            alias: {
              /**
               * twin.macro inserts styled-components into the code during the compilation process
               * But it will not be installed under the user project.
               * So need to add alias
               */
              'styled-components': require.resolve('styled-components'),
            },
            globalVars: {
              'process.env.IS_REACT18': process.env.IS_REACT18,
            },
          },
          tools: {
            styledComponents: {
              // https://github.com/styled-components/babel-plugin-styled-components/issues/287
              topLevelImportPaths: ['@modern-js/runtime/styled'],
            },
          },
        };
      },
      async beforeRestart() {
        // cleanRequireCache([
        //   require.resolve('../state/cli'),
        //   require.resolve('../router/cli'),
        //   require.resolve('../ssr/cli'),
        // ]);
      },
    };
  },
});

export default runtimePlugin;
