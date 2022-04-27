import { inquirer } from '@modern-js/utils';
import { Entrypoint } from '@modern-js/types';

export const getSpecifiedEntries = async (
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
        message: '请选择需要构建的入口',
        validate(answer: string[]) {
          if (answer.length < 1) {
            return 'You must choose at least one topping.';
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
        `can not found entry ${name}, compiler entry should in ${entryNames.join(
          ', ',
        )}`,
      );
    }
  });

  return entry;
};
