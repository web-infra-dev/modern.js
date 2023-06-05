import { fs } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import { BuilderInstance } from '@modern-js/builder';
import { join } from 'path';

export function setupProgram(builder: BuilderInstance) {
  const pkgJson = join(__dirname, '../package.json');
  const { version } = fs.readJSONSync(pkgJson);

  program.name('builder').usage('<command> [options]').version(version);

  program
    .command('dev')
    .description('starting the dev server')
    .action(async () => {
      await builder.startDevServer();
    });

  program
    .command('build')
    .description('build the app for production')
    .action(async () => {
      await builder.build();
    });

  program.parse();
}
