import { chalk, inquirer } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types';
import { i18n, localeKeys } from '../locale';

/**
 * Allow user to select entrypoints to build.
 */
export const getSelectedEntries = async (
  entry: string[] | boolean,
  entrypoints: Entrypoint[],
): Promise<string[]> => {
  const entryNames = entrypoints.map(e => e.entryName);

  if (!entry) {
    return entryNames;
  }

  if (typeof entry === 'boolean') {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        choices: entryNames,
        message: i18n.t(localeKeys.command.dev.selectEntry),
        validate(answer: string[]) {
          if (answer.length < 1) {
            return i18n.t(localeKeys.command.dev.requireEntry);
          }
          return true;
        },
      },
    ]);

    return selected;
  }

  entry.forEach(name => {
    if (!entryNames.includes(name)) {
      throw new Error(
        `Can not found entry ${chalk.yellow(
          name,
        )}, the entry should be one of ${chalk.yellow(entryNames.join(', '))}`,
      );
    }
  });

  return entry;
};
