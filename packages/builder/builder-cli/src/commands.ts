import { join } from 'path';
import { fs } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import type { BuilderInstance } from '@modern-js/builder';

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

  program
    .command('serve')
    .description('preview the production build locally')
    .action(async () => {
      await builder.serve();
    });

  program.parse();
}
