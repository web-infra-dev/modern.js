import chalk from 'chalk';
import { catchUnhandledReject } from '@modern-js/libuild-utils';
import { Command, Option, ParseOptions } from 'commander';
import { Libuilder } from './core';
import { CLIConfig } from './types';

export async function run(userArgs?: string[]) {
  const program = new Command();
  const { version } = require('../package.json');
  const args = userArgs ?? process.argv;
  const argOptions: ParseOptions = userArgs ? { from: 'user' } : { from: 'node' };
  program
    .name('libuild')
    .version(version)
    .argument('[input...]', 'Entry points.')
    .option('-w, --watch', 'When file changed builder will rebuild under watch mode')
    .option('--bundle', 'Bundle code')
    .option('--no-bundle', 'Only transform code')
    .option('--splitting', 'Code splitting')
    .option('--clean', 'Clean output directory before build')
    .option('--metafile', 'Emit esbuild metafile')
    .option('--config-file <configFile>', 'The path of config file, default by `libuild.config.ts`')
    .option('--root <root>', 'Project root dir')
    .option('--outdir <outdir>', 'The directory for output')
    .option('--source-dir <sourceDir>', 'The directory for source')
    .option('--entry-names <entryNames>', 'The file names of the output files')
    .option('--chunk-names <chunkNames>', 'The file names of the chunks of shared code')
    .option('--external <external...>', 'Exclude it from your build')
    .addOption(
      new Option('--log-level <logLevel>', 'The level of the console log').choices([
        'silent',
        'error',
        'warning',
        'info',
        'debug',
        'verbose',
      ])
    )
    .addOption(new Option('--source-map [sourceMap]', 'The mode of sourceMap').choices(['inline', 'external']))
    .addOption(new Option('--format <format>', 'Module format').choices(['iife', 'umd', 'cjs', 'esm']))
    .addOption(new Option('--minify <minify>', 'Minify JS').choices(['esbuild', 'minify']))
    .addOption(
      new Option('--platform <platform>', 'Generate code intended for the browser or node').choices(['node', 'browser'])
    )
    .addOption(new Option('--jsx <jsx>', '').choices(['automatic', 'preserve', 'transform']))
    .action(async (input: CLIConfig['input'], options: CLIConfig) => {
      const start = Date.now();
      if (input?.length) {
        options.input = input;
      }
      await Libuilder.run(options);
      const end = Date.now() - start;
      console.info(chalk.green(`Build completed in ${end}ms`));
    });
  await catchUnhandledReject(program.parseAsync(args, argOptions), (err: Error) => {
    console.log(err.toString());
    process.exit(1);
  });
}
