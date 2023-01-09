import type { CliPlugin } from '@modern-js/core';
import changesetPlugin from '@modern-js/plugin-changeset';
import lintPlugin from '@modern-js/plugin-lint';
import { Import } from '@modern-js/utils';
import { i18n } from './locale';
import { newCli, deployCli, clearCli } from './cli';
import { getLocaleLanguage } from './utils/language';
import { hooks } from './hooks';
import { MonorepoTools } from './type';

const upgradeModel: typeof import('@modern-js/upgrade') = Import.lazy(
  '@modern-js/upgrade',
  require,
);

export default (): CliPlugin<MonorepoTools> => ({
  name: '@modern-js/monorepo-tools',
  usePlugins: [changesetPlugin(), lintPlugin()],
  registerHook: hooks,
  setup: api => {
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      commands({ program }) {
        clearCli(program, api);
        deployCli(program, api);
        newCli(program, locale);
        upgradeModel.defineCommand(program.command('upgrade'));
      },
    };
  },
  post: ['@modern-js/plugin-changeset'],
});
