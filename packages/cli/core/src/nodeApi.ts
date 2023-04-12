import { cli, CoreOptions } from '.';

export const dev = (options?: CoreOptions, commandOptions: string[] = []) => {
  cli.runCommand('dev', commandOptions, options);
};

export const build = (options?: CoreOptions, commandOptions: string[] = []) => {
  cli.runCommand('build', commandOptions, options);
};

export const deploy = (
  options?: CoreOptions,
  commandOptions: string[] = [],
) => {
  cli.runCommand('deploy', commandOptions, options);
};
