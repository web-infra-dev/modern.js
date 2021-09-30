import path from 'path';
import fs from 'fs';
import JSON5 from 'json5';
import { resolveBabelConfig } from '@modern-js/server-utils';
import { ModernServerOptions } from '../../type';

const registerDirs = ['./api', './server', './config/mock', './shared'];

export const enableRegister = (
  projectRoot: string,
  config: ModernServerOptions['config'],
) => {
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  const isTsProject = fs.existsSync(tsConfigPath);
  if (isTsProject) {
    const tsConfig = fs.readFileSync(tsConfigPath).toString();
    const tsConfigJson = JSON5.parse(tsConfig);
    const { compilerOptions } = tsConfigJson;

    require('tsconfig-paths').register({
      baseUrl: compilerOptions.baseUrl || path.dirname(tsConfigPath),
      paths: compilerOptions?.paths ? compilerOptions?.paths : {},
    });
  }

  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(projectRoot, TS_CONFIG_FILENAME);

  const babelConfig = resolveBabelConfig(projectRoot, config, {
    tsconfigPath,
    syntax: 'es6+',
    type: 'commonjs',
  });

  return require('@babel/register')({
    ...babelConfig,
    only: [
      function (filePath: string) {
        // TODO: wait params
        if (filePath.includes('node_modules/.modern-js')) {
          return true;
        }
        return registerDirs.some(registerDir =>
          filePath.startsWith(path.join(projectRoot, registerDir)),
        );
      },
    ],
    // ignore: [/node_modules/],
    extensions: ['.js', '.ts'],
    babelrc: false,
    root: projectRoot,
  });
};
