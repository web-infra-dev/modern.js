import type { AppTools, CliPlugin } from '@modern-js/app-tools';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-worker',
  setup: ctx => {
    return {
      async beforeDeploy() {
        const { appDirectory, distDirectory } = ctx.useAppContext();

        const configContext = ctx.useResolvedConfigContext();

        console.info(appDirectory, distDirectory, configContext);
      },
    };
  },
});
