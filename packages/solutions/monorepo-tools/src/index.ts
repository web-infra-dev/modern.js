import type { CliPlugin } from '@modern-js/core';
import ChangesetPlugin from '@modern-js/plugin-changeset';
import LintPlugin from '@modern-js/plugin-jarvis';
import { i18n } from './locale';
import { newCli, deployCli, clearCli } from './cli';
import { getLocaleLanguage } from './utils/language';
import { hooks } from './hooks';

export default (): CliPlugin => ({
  name: '@modern-js/monorepo-tools',
  usePlugins: [ChangesetPlugin(), LintPlugin()],
  registerHook: hooks,
  setup: api => {
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      commands({ program }) {
        clearCli(program, api);
        deployCli(program, api);
        newCli(program, locale);
      },
    };
  },
  post: ['@modern-js/plugin-changeset'],
});
