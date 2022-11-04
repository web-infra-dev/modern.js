import chalk from '@modern-js/utils/chalk';
import { ErrorTransformer } from '../shared/types';

export const transformModuleParseError: ErrorTransformer = e => {
  if (e.name === 'ModuleParseError') {
    const rawError: Error = (e.raw as any).error;
    const rawStack = rawError?.stack;

    // remove last line wrapping.
    let sliceEnding = -1;
    // remove stack text.
    rawStack && (sliceEnding += e.message.indexOf(rawStack));
    e.message = e.message.slice(0, sliceEnding);

    // add more description about builder.
    e.message += ' You can try to fix it by:\n';
    const tips = [
      'Check if the file is valid.',
      'Enable relational config of `tools`: https://modernjs.dev/builder/en/api/config-tools.html',
      'Install builder plugins: https://modernjs.dev/builder/en/plugin',
    ];
    e.message += tips.map(tip => ` ${chalk.gray(`*`)} ${tip}`).join('\n');
    e.message += '\n';
    e.message += 'Or you can try to configure bundler loaders manually.';
  }
};
