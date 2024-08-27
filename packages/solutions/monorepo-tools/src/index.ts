import type { CliPlugin } from '@modern-js/core';
import { changesetPlugin } from '@modern-js/plugin-changeset';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { lintPlugin } from '@modern-js/plugin-lint';
import { clearCli, deployCli, newCli, upgradeCli } from './cli';
import { hooks } from './hooks';
import { i18n } from './locale';
import type { MonorepoTools } from './type';

export * from './projects/getProjects';

export const monorepoTools = (): CliPlugin<MonorepoTools> => ({
  name: '@modern-js/monorepo-tools',
  usePlugins: [changesetPlugin(), lintPlugin()],
  registerHook: hooks,
  setup: api => {
    const appContext = api.useAppContext();
    api.setAppContext({
      ...appContext,
      toolsType: 'monorepo-tools',
    });

    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      commands({ program }) {
        clearCli(program, api);
        deployCli(program, api);
        newCli(program);
        upgradeCli(program);
      },
    };
  },
  post: ['@modern-js/plugin-changeset'],
});

export default monorepoTools;
